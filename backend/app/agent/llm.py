import logging
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.language_models.chat_models import BaseChatModel
from ..config import settings

logger = logging.getLogger(__name__)

# Multi-provider cascade: Groq 70B → Gemini Flash → Groq 8B
# This ensures the demo NEVER hits a rate limit wall.


class MultiProviderLLM(BaseChatModel):
    """Cascading LLM that tries multiple providers in order."""

    providers: list

    class Config:
        arbitrary_types_allowed = True

    @property
    def _llm_type(self) -> str:
        return "multi_provider"

    def _generate(self, messages, stop=None, **kwargs):
        last_error = None
        for i, llm in enumerate(self.providers):
            try:
                return llm._generate(messages, stop=stop, **kwargs)
            except Exception as e:
                logger.warning("Provider %d failed (%s), trying next...", i, e)
                last_error = e
                continue
        raise last_error  # type: ignore

    async def _agenerate(self, messages, stop=None, **kwargs):
        last_error = None
        for i, llm in enumerate(self.providers):
            try:
                return await llm._agenerate(messages, stop=stop, **kwargs)
            except Exception as e:
                logger.warning("Provider %d failed (%s), trying next...", i, e)
                last_error = e
                continue
        raise last_error  # type: ignore


def get_llm(temperature: float = 0.7, max_tokens: int = 4096):
    """Return a multi-provider LLM with automatic fallback across services."""
    providers = []

    # 1. Groq Llama 3.3 70B (fastest, 100K tokens/day free)
    if settings.groq_api_key:
        providers.append(ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=settings.groq_api_key,
            temperature=temperature,
            max_tokens=max_tokens,
        ))

    # 2. Gemini 2.0 Flash (1M tokens/day free)
    if settings.gemini_api_key:
        providers.append(ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=settings.gemini_api_key,
            temperature=temperature,
            max_output_tokens=max_tokens,
        ))

    # 3. Groq Llama 3.1 8B (separate rate limit from 70B)
    if settings.groq_api_key:
        providers.append(ChatGroq(
            model="llama-3.1-8b-instant",
            api_key=settings.groq_api_key,
            temperature=temperature,
            max_tokens=max_tokens,
        ))

    if not providers:
        raise ValueError("No API keys configured. Set GROQ_API_KEY or GEMINI_API_KEY in .env")

    # If only one provider, return it directly
    if len(providers) == 1:
        return providers[0]

    return MultiProviderLLM(providers=providers)
