import json
import logging
import traceback
import asyncio

from langchain_core.messages import HumanMessage, AIMessage

logger = logging.getLogger(__name__)

RESEARCH_TIMEOUT_SEC = 120
PLAN_TIMEOUT_SEC = 180
VALIDATE_TIMEOUT_SEC = 120
OPTIMIZE_TIMEOUT_SEC = 150
CHAT_TIMEOUT_SEC = 120


async def _invoke_with_timeout(llm, prompt: str, timeout_sec: int):
    try:
        return await asyncio.wait_for(
            llm.ainvoke([HumanMessage(content=prompt)]),
            timeout=timeout_sec,
        )
    except asyncio.TimeoutError as err:
        raise RuntimeError(f"LLM request timed out after {timeout_sec}s") from err

from .llm import get_llm
from .prompts import (
    RESEARCH_PROMPT,
    PLAN_PROMPT,
    VALIDATE_PROMPT,
    OPTIMIZE_PROMPT,
    CHAT_PROMPT,
)
from .state import TripState
from .tools import geocode_place, get_weather_forecast, get_exchange_rate
from ..utils.date_utils import date_range, count_days
from ..utils.geo import estimate_travel_time_min


def _parse_json_response(text: str):
    """Extract JSON from LLM response, handling markdown code blocks and trailing text."""
    text = text.strip()
    # Remove markdown code blocks
    if "```" in text:
        parts = text.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            if part.startswith("{") or part.startswith("["):
                text = part
                break

    # Determine if we're looking for an object or array
    obj_start = text.find("{")
    arr_start = text.find("[")

    # Use whichever comes first
    if arr_start != -1 and (obj_start == -1 or arr_start < obj_start):
        # Parse as array
        open_char, close_char = "[", "]"
        start = arr_start
    elif obj_start != -1:
        open_char, close_char = "{", "}"
        start = obj_start
    else:
        return {}

    depth = 0
    in_string = False
    escape_next = False
    for i in range(start, len(text)):
        ch = text[i]
        if escape_next:
            escape_next = False
            continue
        if ch == "\\":
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == open_char:
            depth += 1
        elif ch == close_char:
            depth -= 1
            if depth == 0:
                result = json.loads(text[start : i + 1])
                # Wrap arrays in a dict for consistency
                if isinstance(result, list):
                    return {"days": result}
                return result

    # Fallback: try parsing as-is
    return json.loads(text)


async def research_destination(state: TripState) -> dict:
    """Research the destination and find attractions."""
    llm = get_llm()
    prompt = RESEARCH_PROMPT.format(
        destination=state["destination"],
        start_date=state["start_date"],
        end_date=state["end_date"],
        budget_usd=state["budget_usd"],
        travelers=state.get("travelers", 1),
        interests=", ".join(state.get("interests", [])),
        accommodation_area=state.get("accommodation_area", "city center"),
    )

    response = await _invoke_with_timeout(llm, prompt, RESEARCH_TIMEOUT_SEC)
    try:
        data = _parse_json_response(response.content)
        return {
            "destination_info": data.get("destination_info", ""),
            "attractions": data.get("attractions", []),
            "research_sufficient": data.get("research_sufficient", True),
            "current_phase": "research",
        }
    except (json.JSONDecodeError, KeyError) as e:
        return {
            "destination_info": response.content,
            "attractions": [],
            "research_sufficient": True,
            "error": f"Failed to parse research response: {e}",
            "current_phase": "research",
        }


async def fetch_external_data(state: TripState) -> dict:
    """Fetch weather, currency, and geocode data from free APIs."""
    updates = {"current_phase": "fetching_data"}

    # Geocode destination for weather
    try:
        geo = await geocode_place.ainvoke(state["destination"])
        if "error" not in geo:
            lat, lng = geo["lat"], geo["lng"]

            # Fetch weather
            try:
                weather = await get_weather_forecast.ainvoke({
                    "lat": lat,
                    "lng": lng,
                    "start_date": state["start_date"],
                    "end_date": state["end_date"],
                })
                updates["weather_forecast"] = _build_weather_list(weather, state)
            except Exception:
                updates["weather_forecast"] = []

            # Fetch currency — use user's selection, fall back to destination detection
            try:
                currency_code = state.get("currency", "USD")
                if not currency_code or currency_code == "USD":
                    currency_map = {
                        "europe": "EUR", "france": "EUR", "germany": "EUR", "italy": "EUR",
                        "spain": "EUR", "japan": "JPY", "uk": "GBP", "england": "GBP",
                        "india": "INR", "thailand": "THB", "australia": "AUD",
                        "canada": "CAD", "mexico": "MXN", "brazil": "BRL",
                        "china": "CNY", "korea": "KRW", "turkey": "TRY",
                    }
                    dest_lower = state["destination"].lower()
                    for key, code in currency_map.items():
                        if key in dest_lower:
                            currency_code = code
                            break

                if currency_code != "USD":
                    rate_data = await get_exchange_rate.ainvoke(currency_code)
                    updates["currency_info"] = {
                        "code": currency_code,
                        "rate_to_usd": rate_data.get("rates", {}).get(currency_code, 1.0),
                    }
                else:
                    updates["currency_info"] = {"code": "USD", "rate_to_usd": 1.0}
            except Exception:
                updates["currency_info"] = {"code": "USD", "rate_to_usd": 1.0}
    except Exception:
        traceback.print_exc()

    return updates


def _build_weather_list(weather_data: dict, state: TripState) -> list[dict]:
    """Convert Open-Meteo daily data to a list of weather dicts per day."""
    if not weather_data or "time" not in weather_data:
        return []
    dates = date_range(state["start_date"], state["end_date"])
    temps_max = weather_data.get("temperature_2m_max", [])
    temps_min = weather_data.get("temperature_2m_min", [])
    precip = weather_data.get("precipitation_sum", [])
    codes = weather_data.get("weathercode", [])
    weather_list = []
    for i, date in enumerate(dates):
        if i < len(weather_data.get("time", [])):
            weather_list.append({
                "date": date,
                "temp_max": temps_max[i] if i < len(temps_max) else None,
                "temp_min": temps_min[i] if i < len(temps_min) else None,
                "precipitation": precip[i] if i < len(precip) else 0,
                "weathercode": codes[i] if i < len(codes) else 0,
            })
    return weather_list


async def plan_itinerary(state: TripState) -> dict:
    """Create a day-by-day itinerary from research data."""
    llm = get_llm(max_tokens=8192)
    num_days = count_days(state["start_date"], state["end_date"])

    validation_feedback = ""
    if state.get("validation_issues"):
        issues_text = "\n".join(
            f"- Day {i['day_number']}: {i['description']}"
            for i in state["validation_issues"]
            if i.get("severity") == "error"
        )
        if issues_text:
            validation_feedback = f"IMPORTANT: Fix these issues from the previous plan:\n{issues_text}"

    prompt = PLAN_PROMPT.format(
        destination=state["destination"],
        start_date=state["start_date"],
        end_date=state["end_date"],
        num_days=num_days,
        budget_usd=state["budget_usd"],
        travelers=state.get("travelers", 1),
        interests=", ".join(state.get("interests", [])),
        attractions_json=json.dumps(state.get("attractions", []), indent=2),
        weather_json=json.dumps(state.get("weather_forecast", []), indent=2),
        validation_feedback=validation_feedback,
    )

    response = await _invoke_with_timeout(llm, prompt, PLAN_TIMEOUT_SEC)
    try:
        data = _parse_json_response(response.content)
        days = data.get("days", [])

        if not days:
            if isinstance(data, list):
                days = data
            else:
                logger.warning("No 'days' key found. Keys: %s", list(data.keys()) if isinstance(data, dict) else type(data))

        # Calculate travel times between activities using haversine
        for idx, day in enumerate(days):
            if not isinstance(day, dict):
                day = {}
                days[idx] = day

            activities = day.get("activities", [])
            if not isinstance(activities, list):
                activities = []
            normalized_activities = []

            # Ensure all activities have expected keys with safe defaults.
            for act in activities:
                if not isinstance(act, dict):
                    continue
                act.setdefault("name", "Untitled activity")
                act.setdefault("category", "landmark")
                act.setdefault("lat", 0.0)
                act.setdefault("lng", 0.0)
                act.setdefault("cost_estimate_usd", 0)
                act.setdefault("estimated_duration_hrs", 1)
                act.setdefault("rating", 0)
                act.setdefault("opening_hours", "")
                act.setdefault("description", "")
                act.setdefault("start_time", "")
                act.setdefault("end_time", "")
                normalized_activities.append(act)

            day["day_number"] = day.get("day_number", idx + 1)
            day["date"] = day.get("date", "")
            day["activities"] = normalized_activities
            travel_times = []
            for i in range(len(normalized_activities) - 1):
                a1, a2 = normalized_activities[i], normalized_activities[i + 1]
                if a1["lat"] and a1["lng"] and a2["lat"] and a2["lng"]:
                    t = estimate_travel_time_min(a1["lat"], a1["lng"], a2["lat"], a2["lng"])
                else:
                    t = 15  # default 15 min if coords missing
                travel_times.append(t)
            day["travel_times_min"] = travel_times
            day.setdefault("total_cost_usd", sum(
                float(a.get("cost_estimate_usd", 0) or 0) for a in normalized_activities
            ))
            day.setdefault("weather_summary", "")

        iteration_count = state.get("iteration_count", 0) + 1
        return {
            "itinerary": days,
            "iteration_count": iteration_count,
            "current_phase": "planning",
        }
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        logger.error("Failed to parse itinerary: %s", e)
        return {
            "itinerary": [],
            "error": f"Failed to parse itinerary: {e}",
            "iteration_count": state.get("iteration_count", 0) + 1,
            "current_phase": "planning",
        }


async def validate_itinerary(state: TripState) -> dict:
    """Validate the itinerary for conflicts and issues."""
    llm = get_llm(temperature=0.3)
    num_days = count_days(state["start_date"], state["end_date"])

    prompt = VALIDATE_PROMPT.format(
        destination=state["destination"],
        budget_usd=state["budget_usd"],
        num_days=num_days,
        itinerary_json=json.dumps(state.get("itinerary", []), indent=2),
    )

    response = await _invoke_with_timeout(llm, prompt, VALIDATE_TIMEOUT_SEC)
    try:
        data = _parse_json_response(response.content)
        return {
            "validation_pass": data.get("validation_pass", True),
            "validation_issues": data.get("issues", []),
            "current_phase": "validating",
        }
    except (json.JSONDecodeError, KeyError):
        return {
            "validation_pass": True,
            "validation_issues": [],
            "current_phase": "validating",
        }


async def optimize_route(state: TripState) -> dict:
    """Optimize activity order within each day to minimize travel."""
    llm = get_llm(temperature=0.3)

    prompt = OPTIMIZE_PROMPT.format(
        itinerary_json=json.dumps(state.get("itinerary", []), indent=2),
    )

    response = await _invoke_with_timeout(llm, prompt, OPTIMIZE_TIMEOUT_SEC)
    try:
        data = _parse_json_response(response.content)
        days = data.get("days", state.get("itinerary", []))

        # Recalculate travel times after optimization
        for idx, day in enumerate(days):
            if not isinstance(day, dict):
                day = {}
                days[idx] = day
            activities = day.get("activities", [])
            if not isinstance(activities, list):
                activities = []
            normalized_activities = []
            for act in activities:
                if not isinstance(act, dict):
                    continue
                act.setdefault("name", "Untitled activity")
                act.setdefault("category", "landmark")
                act.setdefault("lat", 0.0)
                act.setdefault("lng", 0.0)
                act.setdefault("cost_estimate_usd", 0)
                act.setdefault("estimated_duration_hrs", 1)
                act.setdefault("rating", 0)
                act.setdefault("opening_hours", "")
                act.setdefault("description", "")
                act.setdefault("start_time", "")
                act.setdefault("end_time", "")
                normalized_activities.append(act)
            day["day_number"] = day.get("day_number", idx + 1)
            day["date"] = day.get("date", "")
            day["activities"] = normalized_activities
            travel_times = []
            for i in range(len(normalized_activities) - 1):
                a1, a2 = normalized_activities[i], normalized_activities[i + 1]
                if a1.get("lat") and a1.get("lng") and a2.get("lat") and a2.get("lng"):
                    t = estimate_travel_time_min(a1["lat"], a1["lng"], a2["lat"], a2["lng"])
                else:
                    t = 15
                travel_times.append(t)
            day["travel_times_min"] = travel_times
            day.setdefault("total_cost_usd", sum(
                float(a.get("cost_estimate_usd", 0) or 0) for a in normalized_activities
            ))
            day.setdefault("weather_summary", "")

        return {
            "itinerary": days,
            "optimized": True,
            "current_phase": "optimizing",
        }
    except (json.JSONDecodeError, KeyError, TypeError):
        return {
            "optimized": True,
            "current_phase": "optimizing",
        }


async def handle_chat(state: TripState) -> dict:
    """Process user chat messages and decide on re-planning actions."""
    llm = get_llm()
    messages = state.get("messages", [])

    if not messages:
        return {"current_phase": "done"}

    last_message = messages[-1].content if messages else ""

    prompt = CHAT_PROMPT.format(
        destination=state["destination"],
        start_date=state["start_date"],
        end_date=state["end_date"],
        budget_usd=state["budget_usd"],
        interests=", ".join(state.get("interests", [])),
        itinerary_json=json.dumps(state.get("itinerary", []), indent=2),
        user_message=last_message,
    )

    response = await _invoke_with_timeout(llm, prompt, CHAT_TIMEOUT_SEC)
    try:
        data = _parse_json_response(response.content)
        next_phase = data.get("next_phase", "done")
        response_text = data.get("response", "I'll update your itinerary.")

        return {
            "messages": [AIMessage(content=response_text)],
            "current_phase": next_phase,
            "iteration_count": 0,
        }
    except (json.JSONDecodeError, KeyError):
        return {
            "messages": [AIMessage(content=response.content)],
            "current_phase": "done",
        }
