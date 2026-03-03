import logging
import asyncio
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.language_models.chat_models import BaseChatModel
from ..config import settings

logger = logging.getLogger(__name__)

# Multi-provider cascade with retry.
# Each model has its OWN rate-limit bucket, so adding multiple Gemini
# models (2.0-flash, 2.0-flash-lite, 1.5-flash) effectively 3x the free quota.


class MultiProviderLLM(BaseChatModel):
    """Cascading LLM that tries multiple providers in order, with one retry pass."""

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
        # First pass: try every provider once
        for i, llm in enumerate(self.providers):
            try:
                return await llm._agenerate(messages, stop=stop, **kwargs)
            except Exception as e:
                logger.warning("Provider %d failed (%s), trying next...", i, e)
                last_error = e
                continue

        # Second pass: wait 30s then retry all (rate limits may have reset)
        logger.warning("All providers failed. Waiting 30s before retry pass...")
        await asyncio.sleep(30)
        for i, llm in enumerate(self.providers):
            try:
                return await llm._agenerate(messages, stop=stop, **kwargs)
            except Exception as e:
                logger.warning("Retry: Provider %d still failed (%s)", i, e)
                last_error = e
                continue

        raise last_error  # type: ignore


def get_llm(temperature: float = 0.7, max_tokens: int = 4096):
    """Return a multi-provider LLM with automatic fallback across services.

    Provider cascade (each has its own rate-limit bucket):
      1. Groq  — llama-3.3-70b-versatile   (100K tokens/day free)
      2. Gemini — gemini-2.0-flash           (1500 RPD free)
      3. Gemini — gemini-2.0-flash-lite      (separate quota, higher limits)
      4. Gemini — gemini-1.5-flash           (separate quota)
      5. Groq  — llama-3.1-8b-instant        (separate token pool)
      6. Groq  — gemma2-9b-it                (separate token pool)
    """
    providers = []

    # 1. Groq Llama 3.3 70B — fastest, best quality
    if settings.groq_api_key:
        providers.append(ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=settings.groq_api_key,
            temperature=temperature,
            max_tokens=max_tokens,
        ))

    # 2. Gemini 2.0 Flash — strong quality, 1500 RPD free
    if settings.gemini_api_key:
        providers.append(ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=settings.gemini_api_key,
            temperature=temperature,
            max_output_tokens=max_tokens,
        ))

    # 3. Gemini 2.0 Flash Lite — lighter model, separate quota
    if settings.gemini_api_key:
        providers.append(ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-lite",
            google_api_key=settings.gemini_api_key,
            temperature=temperature,
            max_output_tokens=max_tokens,
        ))

    # 4. Gemini 1.5 Flash — older but reliable, separate quota
    if settings.gemini_api_key:
        providers.append(ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=settings.gemini_api_key,
            temperature=temperature,
            max_output_tokens=max_tokens,
        ))

    # 5. Groq Llama 3.1 8B — separate token pool from 70B
    if settings.groq_api_key:
        providers.append(ChatGroq(
            model="llama-3.1-8b-instant",
            api_key=settings.groq_api_key,
            temperature=temperature,
            max_tokens=max_tokens,
        ))

    # 6. Groq Gemma2 9B — yet another separate token pool
    if settings.groq_api_key:
        providers.append(ChatGroq(
            model="gemma2-9b-it",
            api_key=settings.groq_api_key,
            temperature=temperature,
            max_tokens=max_tokens,
        ))

    if not providers:
        raise ValueError("No API keys configured. Set GROQ_API_KEY or GEMINI_API_KEY in .env")

    if len(providers) == 1:
        return providers[0]

    return MultiProviderLLM(providers=providers)
