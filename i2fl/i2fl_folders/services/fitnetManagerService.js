const fetch = require("node-fetch-commonjs");
const StaticValues = require('../enums/StaticValues.enum')


async function fitnetDeleteLeave(id) {
    const response = await fetch(StaticValues.URL_fitnet + "/FitnetManager/rest/leaves/delete/" + id, {
        method: 'delete',
        headers: {
            authorization: StaticValues.FITNET_ACESS_TOKEN

            // Authorization: StaticValues.FITNET_ACESS_TOKEN
        },
    });
    return response;
}
async function fitnetGetLeave(companyId, month, year, fitnetnID) {
    let response;
    if(companyId) {
        response = await fetch(StaticValues.URL_fitnet + "/FitnetManager/rest/leaves/getLeavesWithRepartition/" + (companyId) + "/" + month + "/" + year, {
            method: 'get',
            headers: {
                Authorization: StaticValues.FITNET_ACESS_TOKEN
            },
        });
    }
    else {
        response = await fetch(StaticValues.URL_fitnet + "/FitnetManager/rest/leaves/getLeavesWithRepartitionByCollaborator/" + (fitnetnID) + "/" + month + "/" + year, {
            method: 'get',
            headers: {
                Authorization: StaticValues.FITNET_ACESS_TOKEN
            },
        });
    }
   
    return response;
}



async function fitnetPostLeave(fitnetLeaveRequest) {
    const response = await fetch(StaticValues.URL_fitnet + "/FitnetManager/rest/leaves/create", {
        method: 'POST',
        headers: {
            'Authorization': StaticValues.FITNET_ACESS_TOKEN,
            'Content-type': 'application/json; charset=UTF-8',

        },
        body: JSON.stringify(fitnetLeaveRequest),
    })
    return response
}

async function getEmployees() {
    const response = await fetch(StaticValues.URL_fitnet + "/FitnetManager/rest/employees", {
        method: 'GET',
        headers: {
            'Authorization': StaticValues.FITNET_ACESS_TOKEN,
            'Content-type': 'application/json; charset=UTF-8',

        }
    })
    return response 
}


module.exports = { fitnetGetLeave, fitnetDeleteLeave, fitnetPostLeave, getEmployees };
