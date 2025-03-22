# Formula One MCP Server

This Model Context Protocol (MCP) server provides access to Formula One data and statistics using the FastF1 Python library. It allows you to access race calendars, event information, session results, driver data, lap times, telemetry, and championship standings through a clean MCP interface.

## Features

- Get Formula One race calendars for specific seasons
- Retrieve detailed information about Grand Prix events
- Get session results (Race, Qualifying, Practice)
- Access driver information and statistics
- Analyze driver performance with lap times and telemetry data
- Compare multiple drivers' performance
- Get championship standings for drivers and constructors

## Prerequisites

- Node.js 18 or later
- Python 3.8 or later
- FastF1 library

## Installation

### 1. Install Python dependencies

```bash
pip install fastf1 pandas numpy
```

### 2. Install Node.js dependencies

```bash
cd f1-mcp-server
npm install
```

### 3. Build the TypeScript code

```bash
npm run build
```

### 4. Add to MCP settings

Add the following to your Cline MCP settings file (`~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "formula1": {
      "command": "node",
      "args": ["/Users/rakeshgangwar/Documents/Cline/MCP/f1-mcp-server/build/index.js"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Available Tools

### 1. `get_event_schedule`

Get Formula One race calendar for a specific season.

**Parameters:**
- `year` (number): Season year (e.g., 2023)

### 2. `get_event_info`

Get detailed information about a specific Formula One Grand Prix.

**Parameters:**
- `year` (number): Season year (e.g., 2023)
- `identifier` (string): Event name or round number (e.g., "Monaco" or "7")

### 3. `get_session_results`

Get results for a specific Formula One session.

**Parameters:**
- `year` (number): Season year (e.g., 2023)
- `event_identifier` (string): Event name or round number (e.g., "Monaco" or "7")
- `session_name` (string): Session name (e.g., "Race", "Qualifying", "Sprint", "FP1", "FP2", "FP3")

### 4. `get_driver_info`

Get information about a specific Formula One driver.

**Parameters:**
- `year` (number): Season year (e.g., 2023)
- `event_identifier` (string): Event name or round number (e.g., "Monaco" or "7")
- `session_name` (string): Session name (e.g., "Race", "Qualifying", "Sprint", "FP1", "FP2", "FP3")
- `driver_identifier` (string): Driver identifier (number, code, or name; e.g., "44", "HAM", "Hamilton")

### 5. `analyze_driver_performance`

Analyze a driver's performance in a Formula One session.

**Parameters:**
- `year` (number): Season year (e.g., 2023)
- `event_identifier` (string): Event name or round number (e.g., "Monaco" or "7")
- `session_name` (string): Session name (e.g., "Race", "Qualifying", "Sprint", "FP1", "FP2", "FP3")
- `driver_identifier` (string): Driver identifier (number, code, or name; e.g., "44", "HAM", "Hamilton")

### 6. `compare_drivers`

Compare performance between multiple Formula One drivers.

**Parameters:**
- `year` (number): Season year (e.g., 2023)
- `event_identifier` (string): Event name or round number (e.g., "Monaco" or "7")
- `session_name` (string): Session name (e.g., "Race", "Qualifying", "Sprint", "FP1", "FP2", "FP3")
- `drivers` (string): Comma-separated list of driver codes (e.g., "HAM,VER,LEC")

### 7. `get_telemetry`

Get telemetry data for a specific Formula One lap.

**Parameters:**
- `year` (number): Season year (e.g., 2023)
- `event_identifier` (string): Event name or round number (e.g., "Monaco" or "7")
- `session_name` (string): Session name (e.g., "Race", "Qualifying", "Sprint", "FP1", "FP2", "FP3")
- `driver_identifier` (string): Driver identifier (number, code, or name; e.g., "44", "HAM", "Hamilton")
- `lap_number` (number, optional): Lap number (gets fastest lap if not provided)

### 8. `get_championship_standings`

Get Formula One championship standings.

**Parameters:**
- `year` (number): Season year (e.g., 2023)
- `round_num` (number, optional): Round number (gets latest standings if not provided)

## Example Usage

Once the server is added to your MCP settings and running, you can use these tools with Cline to access Formula One data.

Example queries:
- "Show me the 2023 Formula One race calendar"
- "Get the results from the 2022 Monaco Grand Prix"
- "Compare Hamilton and Verstappen's performance in the 2021 British Grand Prix"
- "Show me the telemetry data from Leclerc's fastest lap in the 2023 Italian Grand Prix qualifying"
- "What are the current F1 championship standings?"

## Data Source

This server uses the [FastF1](https://github.com/theOehrly/Fast-F1) Python library, which provides access to official Formula 1 timing data, car telemetry, and session results.

## License

MIT
