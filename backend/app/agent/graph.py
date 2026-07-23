from langgraph.graph import StateGraph, START, END
from .state import AgentState
from .nodes import extract_fields, merge_fields, risk_assessment, completeness_check, compose_reply

builder = StateGraph(AgentState)

builder.add_node("extract_fields", extract_fields)
builder.add_node("merge_fields", merge_fields)
builder.add_node("risk_assessment", risk_assessment)
builder.add_node("completeness_check", completeness_check)
builder.add_node("compose_reply", compose_reply)

builder.add_edge(START, "extract_fields")
builder.add_edge("extract_fields", "merge_fields")
builder.add_edge("merge_fields", "risk_assessment")
builder.add_edge("risk_assessment", "completeness_check")
builder.add_edge("completeness_check", "compose_reply")
builder.add_edge("compose_reply", END)

complaint_graph = builder.compile()
