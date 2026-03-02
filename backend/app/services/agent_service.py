import json
import logging
import traceback
from typing import AsyncGenerator

from langchain_core.messages import HumanMessage

from ..agent.graph import compiled_graph
from ..agent.state import TripState
from .itinerary_service import save_itinerary

logger = logging.getLogger(__name__)


async def run_agent_stream(
    trip: dict, user_message: str, action: str
) -> AsyncGenerator[dict, None]:
    """Run the LangGraph agent and stream events back."""

    initial_state: TripState = {
        "destination": trip["destination"],
        "start_date": trip["start_date"],
        "end_date": trip["end_date"],
        "budget_usd": trip["budget_usd"],
        "interests": trip.get("interests", []),
        "travelers": trip.get("travelers", 1),
        "accommodation_area": trip.get("accommodation_area", ""),
        "messages": [HumanMessage(content=user_message)] if user_message else [],
        "attractions": trip.get("attractions", []),
        "itinerary": trip.get("itinerary", []),
        "weather_forecast": trip.get("weather_forecast", []),
        "currency_info": trip.get("currency_info", {}),
        "iteration_count": 0,
        "research_sufficient": False,
        "validation_pass": False,
        "optimized": False,
        "current_phase": "",
        "error": "",
        "destination_info": "",
        "validation_issues": [],
    }

    if action == "chat" and trip.get("itinerary"):
        config = {"configurable": {"thread_id": trip["_id"]}}
        initial_state["current_phase"] = "chat"
    else:
        config = {"configurable": {"thread_id": trip["_id"]}}

    try:
        current_node = ""
        accumulated_state = {}

        async for event in compiled_graph.astream(
            initial_state, config=config, stream_mode="updates"
        ):
            for node_name, node_output in event.items():
                if node_name != current_node:
                    if current_node:
                        yield {"type": "node_end", "node": current_node}
                    current_node = node_name
                    yield {"type": "node_start", "node": node_name}

                if node_output:
                    safe_output = {}
                    for key in [
                        "destination_info", "attractions", "weather_forecast",
                        "currency_info", "itinerary", "validation_issues",
                        "validation_pass", "optimized", "current_phase", "error",
                    ]:
                        if key in node_output:
                            safe_output[key] = node_output[key]
                            accumulated_state[key] = node_output[key]

                    if safe_output:
                        yield {
                            "type": "state_update",
                            "node": node_name,
                            "data": _serialize(safe_output),
                        }

                    if "messages" in node_output:
                        for msg in node_output["messages"]:
                            if hasattr(msg, "content"):
                                yield {"type": "token", "content": msg.content}

        if current_node:
            yield {"type": "node_end", "node": current_node}

        # Send complete event with itinerary data
        if accumulated_state.get("itinerary"):
            serialized_itinerary = _serialize(accumulated_state.get("itinerary", []))
            yield {
                "type": "complete",
                "data": {
                    "itinerary": serialized_itinerary,
                    "destination_info": accumulated_state.get("destination_info", ""),
                },
            }

            # Save to MongoDB
            try:
                itinerary_data = {
                    "destination_info": accumulated_state.get("destination_info", ""),
                    "currency": accumulated_state.get("currency_info", {}),
                    "weather_forecast": accumulated_state.get("weather_forecast", []),
                    "attractions": _serialize(accumulated_state.get("attractions", [])),
                    "days": serialized_itinerary,
                    "total_cost_usd": sum(
                        float(d.get("total_cost_usd", 0) or 0)
                        for d in accumulated_state.get("itinerary", [])
                    ),
                }
                await save_itinerary(trip["_id"], itinerary_data)
                logger.info("Itinerary saved to MongoDB for trip %s", trip["_id"])
            except Exception as save_err:
                logger.warning("Failed to save itinerary: %s", save_err)
        else:
            yield {"type": "complete", "data": {}}

    except Exception as e:
        traceback.print_exc()
        yield {"type": "error", "content": str(e)}


def _serialize(obj):
    """Make sure the object is JSON-serializable."""
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_serialize(item) for item in obj]
    elif hasattr(obj, "content"):
        return str(obj.content)
    else:
        try:
            json.dumps(obj)
            return obj
        except (TypeError, ValueError):
            return str(obj)
