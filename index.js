const fetch = require('node-fetch')
const d3 = require('d3-dsv')
const fs = require('fs').promises
require('dotenv').config()


var headers = {
    'Authorization': 'Bearer ' + process.env.CANVAS_API_TOKEN
}

async function fetchRequest(url) {
    try {
        // Fetch request and parse as JSON
        const response = await await fetch(url, { headers });
        let assignments = await response.json();

        // Extract the url of the response's "next" relational Link header
        let next_page;
        if (/<([^>]+)>; rel="next"/g.exec(response.headers.get("link")))
            next_page = /<([^>]+)>; rel="next"/g.exec(response.headers.get("link"))[1];

        // If another page exists, merge it into the array
        // Else return the complete array of paginated output
        if (next_page) {
            let temp_assignments = await fetchRequest(next_page);
            assignments = assignments.concat(temp_assignments);
        }

        return assignments;
    } catch (err) {
        return console.error(err);
    }
}

async function courseAssignments(course) {
    var assignments = await fetchRequest(`https://byui.instructure.com/api/v1/courses/${course}/assignments`);
    return assignments;
}

function mapToSimple(assignments) {
    return assignments.map(assignment => {
        return {
            name: assignment.name,
            due: assignment.due_at,
            location: assignment.html_url
        }
    })
}

function writeToCSV(assignments) {
    return d3.csvFormat(assignments)
}


async function writeToFile(csv) {
    console.log(__dirname + 'assignments.csv')
    await fs.writeFile(__dirname+ '/assignments.csv', csv);
}


courseAssignments('156742').then(mapToSimple).then(writeToCSV).then(writeToFile)

