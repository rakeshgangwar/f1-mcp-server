#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Path to the Python script
const pythonScriptPath = path.resolve(__dirname, '../python/f1_data.py');
/**
 * Execute a Python function from the f1_data.py script
 * @param functionName - The function to call in the Python script
 * @param args - Arguments to pass to the function
 * @returns The result from the Python script
 */
async function executePythonFunction(functionName, args = []) {
    return new Promise((resolve, reject) => {
        // Use 'python3' for macOS/Linux, 'python' for Windows
        const pythonProcess = spawn('python3', [pythonScriptPath, functionName, ...args]);
        let result = '';
        let error = '';
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });
        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python process exited with code ${code}: ${error}`));
            }
            else {
                try {
                    resolve(JSON.parse(result));
                }
                catch (parseError) {
                    reject(new Error(`Failed to parse Python output: ${result}\n${parseError}`));
                }
            }
        });
    });
}
class FormulaOneServer {
    server;
    constructor() {
        this.server = new Server({
            name: 'formula-one-server',
            version: '1.0.0',
        }, {
            capabilities: {
                resources: {},
                tools: {},
            },
        });
        // Set up the tool handlers
        this.setupToolHandlers();
        // Error handling
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    /**
     * Set up the tool handlers for the MCP server
     */
    setupToolHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'get_event_schedule',
                    description: 'Get Formula One race calendar for a specific season',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            year: {
                                type: 'number',
                                description: 'Season year (e.g., 2023)',
                            },
                        },
                        required: ['year'],
                    },
                },
                {
                    name: 'get_event_info',
                    description: 'Get detailed information about a specific Formula One Grand Prix',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            year: {
                                type: 'number',
                                description: 'Season year (e.g., 2023)',
                            },
                            identifier: {
                                type: 'string',
                                description: 'Event name or round number (e.g., "Monaco" or "7")',
                            },
                        },
                        required: ['year', 'identifier'],
                    },
                },
                {
                    name: 'get_session_results',
                    description: 'Get results for a specific Formula One session',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            year: {
                                type: 'number',
                                description: 'Season year (e.g., 2023)',
                            },
                            event_identifier: {
                                type: 'string',
                                description: 'Event name or round number (e.g., "Monaco" or "7")',
                            },
                            session_name: {
                                type: 'string',
                                description: 'Session name (e.g., "Race", "Qualifying", "Sprint", "FP1", "FP2", "FP3")',
                            },
                        },
                        required: ['year', 'event_identifier', 'session_name'],
                    },
                },
                {
                    name: 'get_driver_info',
                    description: 'Get information about a specific Formula One driver',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            year: {
                                type: 'number',
                                description: 'Season year (e.g., 2023)',
                            },
                            event_identifier: {
                                type: 'string',
                                description: 'Event name or round number (e.g., "Monaco" or "7")',
                            },
                            session_name: {
                                type: 'string',
                                description: 'Session name (e.g., "Race", "Qualifying", "Sprint", "FP1", "FP2", "FP3")',
                            },
                            driver_identifier: {
                                type: 'string',
                                description: 'Driver identifier (number, code, or name; e.g., "44", "HAM", "Hamilton")',
                            },
                        },
                        required: ['year', 'event_identifier', 'session_name', 'driver_identifier'],
                    },
                },
                {
                    name: 'analyze_driver_performance',
                    description: 'Analyze a driver\'s performance in a Formula One session',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            year: {
                                type: 'number',
                                description: 'Season year (e.g., 2023)',
                            },
                            event_identifier: {
                                type: 'string',
                                description: 'Event name or round number (e.g., "Monaco" or "7")',
                            },
                            session_name: {
                                type: 'string',
                                description: 'Session name (e.g., "Race", "Qualifying", "Sprint", "FP1", "FP2", "FP3")',
                            },
                            driver_identifier: {
                                type: 'string',
                                description: 'Driver identifier (number, code, or name; e.g., "44", "HAM", "Hamilton")',
                            },
                        },
                        required: ['year', 'event_identifier', 'session_name', 'driver_identifier'],
                    },
                },
                {
                    name: 'compare_drivers',
                    description: 'Compare performance between multiple Formula One drivers',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            year: {
                                type: 'number',
                                description: 'Season year (e.g., 2023)',
                            },
                            event_identifier: {
                                type: 'string',
                                description: 'Event name or round number (e.g., "Monaco" or "7")',
                            },
                            session_name: {
                                type: 'string',
                                description: 'Session name (e.g., "Race", "Qualifying", "Sprint", "FP1", "FP2", "FP3")',
                            },
                            drivers: {
                                type: 'string',
                                description: 'Comma-separated list of driver codes (e.g., "HAM,VER,LEC")',
                            },
                        },
                        required: ['year', 'event_identifier', 'session_name', 'drivers'],
                    },
                },
                {
                    name: 'get_telemetry',
                    description: 'Get telemetry data for a specific Formula One lap',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            year: {
                                type: 'number',
                                description: 'Season year (e.g., 2023)',
                            },
                            event_identifier: {
                                type: 'string',
                                description: 'Event name or round number (e.g., "Monaco" or "7")',
                            },
                            session_name: {
                                type: 'string',
                                description: 'Session name (e.g., "Race", "Qualifying", "Sprint", "FP1", "FP2", "FP3")',
                            },
                            driver_identifier: {
                                type: 'string',
                                description: 'Driver identifier (number, code, or name; e.g., "44", "HAM", "Hamilton")',
                            },
                            lap_number: {
                                type: 'number',
                                description: 'Lap number (optional, gets fastest lap if not provided)',
                            },
                        },
                        required: ['year', 'event_identifier', 'session_name', 'driver_identifier'],
                    },
                },
                {
                    name: 'get_championship_standings',
                    description: 'Get Formula One championship standings',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            year: {
                                type: 'number',
                                description: 'Season year (e.g., 2023)',
                            },
                            round_num: {
                                type: 'number',
                                description: 'Round number (optional, gets latest standings if not provided)',
                            },
                        },
                        required: ['year'],
                    },
                },
            ],
        }));
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                let result;
                switch (name) {
                    case 'get_event_schedule': {
                        const typedArgs = args;
                        result = await executePythonFunction('get_event_schedule', [typedArgs.year.toString()]);
                        break;
                    }
                    case 'get_event_info': {
                        const typedArgs = args;
                        result = await executePythonFunction('get_event_info', [
                            typedArgs.year.toString(),
                            typedArgs.identifier.toString(),
                        ]);
                        break;
                    }
                    case 'get_session_results': {
                        const typedArgs = args;
                        result = await executePythonFunction('get_session_results', [
                            typedArgs.year.toString(),
                            typedArgs.event_identifier.toString(),
                            typedArgs.session_name.toString(),
                        ]);
                        break;
                    }
                    case 'get_driver_info': {
                        const typedArgs = args;
                        result = await executePythonFunction('get_driver_info', [
                            typedArgs.year.toString(),
                            typedArgs.event_identifier.toString(),
                            typedArgs.session_name.toString(),
                            typedArgs.driver_identifier.toString(),
                        ]);
                        break;
                    }
                    case 'analyze_driver_performance': {
                        const typedArgs = args;
                        result = await executePythonFunction('analyze_driver_performance', [
                            typedArgs.year.toString(),
                            typedArgs.event_identifier.toString(),
                            typedArgs.session_name.toString(),
                            typedArgs.driver_identifier.toString(),
                        ]);
                        break;
                    }
                    case 'compare_drivers': {
                        const typedArgs = args;
                        result = await executePythonFunction('compare_drivers', [
                            typedArgs.year.toString(),
                            typedArgs.event_identifier.toString(),
                            typedArgs.session_name.toString(),
                            typedArgs.drivers.toString(),
                        ]);
                        break;
                    }
                    case 'get_telemetry': {
                        const typedArgs = args;
                        const telemetryArgs = [
                            typedArgs.year.toString(),
                            typedArgs.event_identifier.toString(),
                            typedArgs.session_name.toString(),
                            typedArgs.driver_identifier.toString(),
                        ];
                        if (typedArgs.lap_number !== undefined) {
                            telemetryArgs.push(typedArgs.lap_number.toString());
                        }
                        result = await executePythonFunction('get_telemetry', telemetryArgs);
                        break;
                    }
                    case 'get_championship_standings': {
                        const typedArgs = args;
                        const standingsArgs = [typedArgs.year.toString()];
                        if (typedArgs.round_num !== undefined) {
                            standingsArgs.push(typedArgs.round_num.toString());
                        }
                        result = await executePythonFunction('get_championship_standings', standingsArgs);
                        break;
                    }
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
                if (result.status === 'error') {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Error: ${result.message}\n\n${result.traceback || ''}`,
                            },
                        ],
                        isError: true,
                    };
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result.data, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                console.error(`Error executing tool ${name}:`, error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    /**
     * Run the MCP server
     */
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Formula One MCP server running on stdio');
    }
}
const server = new FormulaOneServer();
server.run().catch(console.error);
