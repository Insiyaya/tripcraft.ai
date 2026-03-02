from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class StreamEvent(BaseModel):
    type: str  # "node_start", "token", "node_end", "state_update", "complete", "error"
    node: str = ""
    content: str = ""
    data: dict = {}


class WSMessage(BaseModel):
    action: str = "chat"  # "generate" or "chat"
    message: str = ""
