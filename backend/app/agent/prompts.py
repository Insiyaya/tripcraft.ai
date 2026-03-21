RESEARCH_PROMPT = """You are a travel research expert. Research the destination and find attractions.

Destination: {destination}
Travel dates: {start_date} to {end_date}
Budget: ${budget_usd} USD for {travelers} traveler(s)
Interests: {interests}
Accommodation area: {accommodation_area}

Research this destination and provide:
1. A brief overview of the destination (2-3 sentences)
2. A list of 15-20 attractions/activities that match the traveler's interests

For each attraction, provide this EXACT JSON format:
{{
    "name": "Attraction Name",
    "category": "museum|restaurant|outdoor|nightlife|shopping|landmark|cultural|adventure",
    "lat": 48.8606,
    "lng": 2.3376,
    "estimated_duration_hrs": 2.5,
    "cost_estimate_usd": 15.0,
    "opening_hours": "09:00-18:00",
    "rating": 4.5,
    "description": "Brief description of why this is worth visiting"
}}

Return your response as JSON with this structure:
{{
    "destination_info": "Overview text here...",
    "attractions": [... list of attraction objects ...],
    "research_sufficient": true
}}

CRITICAL RULES for cost_estimate_usd:
- ALL prices MUST be in USD. Convert from local currency to USD using current rates.
- Use REAL, VERIFIED entry fees — do not guess. Research actual ticket prices.
  Examples: Louvre ~$22 USD, Hawa Mahal ~$2.50 USD (₹200), Tokyo Tower ~$7 USD (¥1000).
- Free attractions (parks, beaches, streets, temples with no entry fee) MUST be 0.
- Restaurants: estimate a realistic per-person meal cost in USD.
- If you are unsure of the exact price, use your best knowledge but never invent prices.

Use real, accurate coordinates. Include a mix of free and paid activities.
"""

PLAN_PROMPT = """You are an expert travel itinerary planner. Create a day-by-day itinerary.

Destination: {destination}
Dates: {start_date} to {end_date} ({num_days} days)
Budget: ${budget_usd} USD for {travelers} traveler(s)
Interests: {interests}

Available attractions:
{attractions_json}

Weather forecast:
{weather_json}

{validation_feedback}

Create a detailed day-by-day itinerary following these rules:
- Plan 3-5 activities per day, considering opening hours
- Keep activities geographically close within each day to minimize travel
- Respect the total budget (${budget_usd})
- Schedule outdoor activities on days with better weather
- Include meal breaks (lunch and dinner suggestions)
- Start each day around 9:00 AM, end by 9:00 PM
- Include realistic start_time and end_time for each activity

Return your response as JSON:
{{
    "days": [
        {{
            "day_number": 1,
            "date": "2026-04-01",
            "activities": [
                {{
                    "name": "Attraction Name",
                    "category": "museum",
                    "lat": 48.8606,
                    "lng": 2.3376,
                    "estimated_duration_hrs": 2.5,
                    "cost_estimate_usd": 15.0,
                    "opening_hours": "09:00-18:00",
                    "rating": 4.5,
                    "description": "Brief description",
                    "start_time": "09:00",
                    "end_time": "11:30"
                }}
            ],
            "weather_summary": "Sunny, 22°C",
            "total_cost_usd": 85.0
        }}
    ],
    "total_cost_usd": 450.0
}}
"""

VALIDATE_PROMPT = """You are a travel logistics validator. Check this itinerary for issues.

Destination: {destination}
Budget: ${budget_usd} USD
Number of days: {num_days}

Itinerary:
{itinerary_json}

Check for these issues:
1. TIME CONFLICTS: Activities overlapping or not enough time between them
2. BUDGET OVERRUN: Total cost exceeding the budget
3. UNREACHABLE: Activities too far apart within the same day (consider travel time)
4. CLOSED: Activities scheduled outside their opening hours
5. MISSING MEALS: Days without any restaurant/food activity

Return your response as JSON:
{{
    "validation_pass": true/false,
    "issues": [
        {{
            "day_number": 1,
            "activity_index": 2,
            "issue_type": "time_conflict|closed|over_budget|unreachable|missing_meals",
            "description": "Description of the issue",
            "severity": "error|warning"
        }}
    ]
}}

If there are no critical issues (only warnings), set validation_pass to true.
"""

OPTIMIZE_PROMPT = """You are a route optimization expert. Optimize the activity order within each day to minimize travel time.

Current itinerary:
{itinerary_json}

For each day, reorder the activities to create the most efficient route (minimize total travel distance between consecutive activities). Keep meal times reasonable (lunch 12-14h, dinner 18-21h).

Update start_time and end_time for each activity after reordering.

Return the optimized itinerary in the same JSON format:
{{
    "days": [... same structure as input but with optimized order and updated times ...],
    "total_cost_usd": ...
}}
"""

CHAT_PROMPT = """You are a helpful travel planning assistant. The user wants to modify their trip itinerary.

Current trip:
- Destination: {destination}
- Dates: {start_date} to {end_date}
- Budget: ${budget_usd}
- Interests: {interests}

Current itinerary:
{itinerary_json}

User's request: {user_message}

Analyze the user's request and determine what action to take:
1. If they want to ADD or REMOVE or CHANGE activities → set next_phase to "research"
2. If they want to REORDER activities or optimize the route → set next_phase to "reoptimize"
3. If they want to CHANGE dates, budget, or interests → set next_phase to "replan"
4. If they're asking a QUESTION about the trip → answer it and set next_phase to "done"

Return your response as JSON:
{{
    "response": "Your helpful response to the user explaining what you'll do",
    "next_phase": "research|replan|reoptimize|done",
    "modifications": {{
        "add_activities": ["activity name to add"],
        "remove_activities": ["activity name to remove"],
        "swap": {{"from": "activity A", "to": "activity B"}},
        "budget_usd": null,
        "interests": null
    }}
}}
"""
