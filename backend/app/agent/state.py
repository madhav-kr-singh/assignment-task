from typing import TypedDict, Literal, Optional, List

class AgentState(TypedDict):
    mode: Literal["new", "edit", "document"]
    raw_text: str
    current_draft: dict
    extracted: dict
    merged_draft: dict
    risk: dict
    missing_fields: List[str]
    completeness_score: int
    reply: str
