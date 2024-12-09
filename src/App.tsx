import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import "./App.css";

// Define types for CSV data
interface CSVData {
    [key: string]: string; // Key-value pair for each row
}

function App() {
    const [data, setData] = useState<CSVData[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);

    // Fetch the CSV file from the public folder
    useEffect(() => {
        fetch("/assets/csv/Detailed_Learning_Timetable.csv")
            .then((response) => response.text())
            .then((csvText) => {
                Papa.parse<CSVData>(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const parsedData = results.data;
                        if (parsedData.length > 0) {
                            setHeaders(Object.keys(parsedData[0])); // Extract headers
                        }
                        setData(parsedData); // Set parsed data
                    },
                });
            });
    }, []);

    return (
        <div className="app">
            <h1>CSV Viewer</h1>
            <div className="table-container">
                {data.length > 0 ? (
                    <table>
                        <thead>
                        <tr>
                            {headers.map((header, index) => (
                                <th key={index}>{header}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {headers.map((header, cellIndex) => (
                                    <td key={cellIndex}>{row[header]}</td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p>Loading data...</p>
                )}
            </div>
        </div>
    );
}

export default App;