from langgraph.graph import END, StateGraph

from .nodes import (
    fetch_external_data,
    handle_chat,
    optimize_route,
    plan_itinerary,
    research_destination,
    validate_itinerary,
)
from .state import TripState


def _research_sufficient_check(state: TripState) -> str:
    """After fetching external data, check if research is sufficient."""
    if state.get("research_sufficient", False):
        return "plan_itinerary"
    return "research_destination"


def _validation_check(state: TripState) -> str:
    """After validation, decide whether to re-plan or optimize."""
    if state.get("validation_pass", False):
        return "optimize_route"
    if state.get("iteration_count", 0) >= 2:
        return "optimize_route"  # stop re-planning after 2 attempts
    return "plan_itinerary"


def _chat_router(state: TripState) -> str:
    """Route chat actions to the appropriate node."""
    phase = state.get("current_phase", "done")
    if phase == "research":
        return "research_destination"
    elif phase == "replan":
        return "plan_itinerary"
    elif phase == "reoptimize":
        return "optimize_route"
    return END


def build_graph() -> StateGraph:
    """Construct and compile the travel planner LangGraph."""
    graph = StateGraph(TripState)

    # Add nodes
    graph.add_node("research_destination", research_destination)
    graph.add_node("fetch_external_data", fetch_external_data)
    graph.add_node("plan_itinerary", plan_itinerary)
    graph.add_node("validate_itinerary", validate_itinerary)
    graph.add_node("optimize_route", optimize_route)
    graph.add_node("handle_chat", handle_chat)

    # Set entry point
    graph.set_entry_point("research_destination")

    # Edges
    graph.add_edge("research_destination", "fetch_external_data")

    graph.add_conditional_edges(
        "fetch_external_data",
        _research_sufficient_check,
        {
            "plan_itinerary": "plan_itinerary",
            "research_destination": "research_destination",
        },
    )

    graph.add_edge("plan_itinerary", "validate_itinerary")

    graph.add_conditional_edges(
        "validate_itinerary",
        _validation_check,
        {
            "optimize_route": "optimize_route",
            "plan_itinerary": "plan_itinerary",
        },
    )

    graph.add_edge("optimize_route", END)

    graph.add_conditional_edges(
        "handle_chat",
        _chat_router,
        {
            "research_destination": "research_destination",
            "plan_itinerary": "plan_itinerary",
            "optimize_route": "optimize_route",
            END: END,
        },
    )

    return graph.compile()


# Singleton compiled graph
compiled_graph = build_graph()
