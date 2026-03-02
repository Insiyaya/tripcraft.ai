import asyncio
from app.agent.graph import compiled_graph


async def test():
    initial_state = {
        "destination": "Paris, France",
        "start_date": "2026-04-01",
        "end_date": "2026-04-03",
        "budget_usd": 1500,
        "interests": ["history", "food", "art"],
        "travelers": 2,
        "accommodation_area": "Le Marais",
        "messages": [],
        "attractions": [],
        "itinerary": [],
        "weather_forecast": [],
        "currency_info": {},
        "iteration_count": 0,
        "research_sufficient": False,
        "validation_pass": False,
        "optimized": False,
        "current_phase": "",
        "error": "",
        "destination_info": "",
        "validation_issues": [],
    }

    print("=" * 60)
    print("LANGGRAPH AGENT - FULL PIPELINE TEST")
    print("Input: Paris, 3 days, $1500 budget, 2 travelers")
    print("Interests: history, food, art")
    print("=" * 60)

    async for event in compiled_graph.astream(
        initial_state,
        config={"configurable": {"thread_id": "test-1"}},
        stream_mode="updates",
    ):
        for node_name, node_output in event.items():
            print(f"\n{'=' * 60}")
            print(f"NODE: {node_name}")
            print("=" * 60)

            if node_output.get("destination_info"):
                info = node_output["destination_info"][:200]
                print(f"Destination Info: {info}...")

            if node_output.get("attractions"):
                attractions = node_output["attractions"]
                print(f"Found {len(attractions)} attractions:")
                for a in attractions[:5]:
                    name = a.get("name", "?")
                    cat = a.get("category", "?")
                    cost = a.get("cost_estimate_usd", 0)
                    print(f"  - {name} ({cat}) ${cost}")
                if len(attractions) > 5:
                    print(f"  ... and {len(attractions) - 5} more")

            if node_output.get("weather_forecast"):
                forecast = node_output["weather_forecast"]
                print(f"Weather ({len(forecast)} days):")
                for w in forecast:
                    print(
                        f"  {w['date']}: {w['temp_min']}C - {w['temp_max']}C, precip: {w['precipitation']}mm"
                    )

            if node_output.get("currency_info") and node_output["currency_info"]:
                ci = node_output["currency_info"]
                print(f"Currency: {ci.get('code', '?')} (1 USD = {ci.get('rate_to_usd', '?')})")

            if node_output.get("itinerary"):
                days = node_output["itinerary"]
                print(f"Itinerary ({len(days)} days):")
                for day in days:
                    acts = day.get("activities", [])
                    cost = day.get("total_cost_usd", 0)
                    weather = day.get("weather_summary", "")
                    print(
                        f"  --- Day {day['day_number']} ({day['date']}) | ${cost} | {weather} ---"
                    )
                    for a in acts:
                        t = a.get("start_time", "?")
                        n = a.get("name", "?")
                        d = a.get("estimated_duration_hrs", 0)
                        print(f"    {t} | {n} ({d}h)")
                    if day.get("travel_times_min"):
                        print(f"    Travel times: {day['travel_times_min']} min")

            if node_output.get("validation_issues"):
                issues = node_output["validation_issues"]
                print(f"Validation ({len(issues)} issues):")
                for i in issues:
                    sev = i.get("severity", "?")
                    dn = i.get("day_number", "?")
                    desc = i.get("description", "?")
                    print(f"  [{sev}] Day {dn}: {desc}")

            if "validation_pass" in node_output:
                status = "PASSED" if node_output["validation_pass"] else "FAILED"
                print(f"Validation Result: {status}")

            if "optimized" in node_output:
                print(f"Route Optimized: {node_output['optimized']}")

            if node_output.get("research_sufficient") is not None:
                print(f"Research Sufficient: {node_output.get('research_sufficient')}")

    print(f"\n{'=' * 60}")
    print("PIPELINE COMPLETE!")
    print("=" * 60)


asyncio.run(test())
