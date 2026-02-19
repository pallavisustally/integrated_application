
import fs from 'fs';
import path from 'path';

const rawData = `State	District	Year	Month	Insolation (in kWh/m²)
Rajasthan	Jaisalmer	2024	December	73
Rajasthan	Barmer	2024	December	70
Punjab	Gurdaspur	2024	December	53
Gujarat	Gandhinagar	2024	December	60
Rajasthan	Bikaner	2024	December	71
Punjab	Amritsar	2024	December	53
Himachal Pradesh	Shimla	2024	December	60
Himachal Pradesh	Manali	2024	December	55
Maharashtra	Mumbai	2024	December	95
Maharashtra	Pune	2024	December	89
Karnataka	Bengaluru	2024	December	106
Tamil Nadu	Chennai	2024	December	94
West Bengal	Kolkata	2024	December	58
Delhi	Central	2024	December	50
Uttar Pradesh	Lucknow	2024	December	47
Rajasthan	Jaipur	2024	December	63
Telangana	Hyderabad	2024	December	84
Kerala	Thiruvananthapuram	2024	December	114
Bihar	Patna	2024	December	49
Assam	Guwahati	2024	December	77
Odisha	Bhubaneswar	2024	December	64
Madhya Pradesh	Bhopal	2024	December	87
Goa	Panaji	2024	December	111
Jharkhand	Ranchi	2024	December	70
Chhattisgarh	Raipur	2024	December	85
Uttarakhand	Dehradun	2024	December	63
Tripura	Agartala	2024	December	81
Sikkim	Gangtok	2024	December	53
Mizoram	Aizawl	2024	December	105
Nagaland	Kohima	2024	December	99
Manipur	Imphal	2024	December	97
Meghalaya	Shillong	2024	December	84
Arunachal Pradesh	Itanagar	2024	December	64
Andhra Pradesh	Visakhapatnam	2024	December	67
Andhra Pradesh	Vijayawada	2024	December	79
Gujarat	Ahmedabad	2024	December	82
Gujarat	Surat	2024	December	89
Maharashtra	Nagpur	2024	December	88
Rajasthan	Jodhpur	2024	December	73
Razor	Udaipur	2024	December	81
Punjab	Ludhiana	2024	December	56
Haryana	Gurugram	2024	December	49
`;

// Interface definition
interface DistrictOutput {
    name: string;
    annualIrradiance: number;
}

interface StateOutput {
    [stateName: string]: DistrictOutput[];
}

const lines = rawData.trim().split('\n').slice(1);

const stateDistrictMap: Record<string, Record<string, number[]>> = {};

lines.forEach(line => {
    const parts = line.split('\t');
    if (parts.length < 5) return;
    const state = parts[0].trim();
    const district = parts[1].trim();
    const insolation = parseFloat(parts[4].trim());

    if (!stateDistrictMap[state]) stateDistrictMap[state] = {};
    if (!stateDistrictMap[state][district]) stateDistrictMap[state][district] = [];

    // Store monthly value if valid
    if (!isNaN(insolation)) {
        stateDistrictMap[state][district].push(insolation);
    }
});

const districtData: StateOutput = {};

Object.entries(stateDistrictMap).forEach(([state, districts]) => {
    districtData[state] = [];
    Object.entries(districts).forEach(([districtName, values]) => {
        if (values.length === 0) return;

        // Calculate average of available months
        const avgMonthly = values.reduce((sum, val) => sum + val, 0) / values.length;

        // Extrapolate to annual: Monthly Avg * 12 * 1.25 (seasonality factor)
        // This is a rough estimation since we have incomplete data
        const annualIrradiance = avgMonthly * 12 * 1.25;

        districtData[state].push({
            name: districtName,
            annualIrradiance: parseFloat(annualIrradiance.toFixed(2))
        });
    });
});

const outputPath = path.join(__dirname, 'district-data.json');
fs.writeFileSync(outputPath, JSON.stringify(districtData, null, 2));
console.log(`Data written to ${outputPath}`);
