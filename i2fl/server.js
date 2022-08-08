const StaticValues = require('./i2fl_folders/enums/StaticValues.enum')
const LuccaService = require("./i2fl_folders/services/luccaService");
const MainFunctions = require("./i2fl_folders/main_functions/MainFunctions");
const Helper = require("./i2fl_folders/helper/Helper");
const express = require('express')
const app = express()
const cron = require("node-cron");
const FitnetManagerService = require("./i2fl_folders/services/fitnetManagerService");

var _ = require('underscore')._;
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
LeaveType = StaticValues.LEAVE_TYPE;




async function updateLeaves(user, minDate, maxDate, month, year) {
    var map = new Map();
    leaves = await MainFunctions.getAcceptedLuccaLeaves(user, minDate, maxDate, month, year);
    map = leaves[0]
    src = leaves[1]
    // *****make this a function****
    src.sort(function (a, b) {
        return new Date(a) - new Date(b)
    })
    //get leave objects

    // *****make this a function****
    var ACPT_LUCCA_LEAVES = src.reduce((res, date, idx, self) => {
        const rangeStart = !idx || new Date(date) - new Date(self[idx - 1]) > (864e5 / 2),
            rangeEnd = idx == self.length - 1 || new Date(self[idx + 1]) - new Date(date) > (864e5 / 2)
        if (rangeStart) res.push({ startDate: date, endDate: date })
        else if (rangeEnd) res[res.length - 1]['endDate'] = date
        return res
    }, []);
    ACPT_LUCCA_LEAVES_trans = await MainFunctions.transform(ACPT_LUCCA_LEAVES, StaticValues.IsLuccaFormat, map);
    var FITNET_LEAVES = await MainFunctions.getFitnetLeaves(month, year);
    returned_fitnet_Leaves = []
    if(FITNET_LEAVES.status==200 || FITNET_LEAVES.length>0) {
        for (const element of FITNET_LEAVES) {
            if(new Date(element.askingDate)> new Date(StaticValues.STARTING_DATE_LIVE_FITNET)){
                returned_fitnet_Leaves.push(element);
            }
        }
    }
    
    FITNET_LEAVES_trans = await MainFunctions.transform(returned_fitnet_Leaves, StaticValues.IsFitnetFormat, null);
    
    console.log("FITNET_LEAVES_trans",FITNET_LEAVES_trans);
    console.log("ACPT_LUCCA_LEAVES_trans",ACPT_LUCCA_LEAVES_trans);
    
    identical = _.isEqual(FITNET_LEAVES_trans, ACPT_LUCCA_LEAVES_trans);
    console.log("identical",identical);
    
    /*
    if (!identical) {
        //first we need to delete the leaves
        let idsToDelete = []
        //if the leaves in fitnet are no longer in lucca, this means that we need to deltet them from lucca
        oldLeavesToDelete = MainFunctions.difference(FITNET_LEAVES_trans, ACPT_LUCCA_LEAVES_trans)
        if(oldLeavesToDelete.length>0) {
            idsToDelete = await getIdsToDelete(oldLeavesToDelete, FITNET_LEAVES);
            console.log("leaves to delete from fitnet: ", idsToDelete);
            await deleteLeaves(idsToDelete);
        }
        console.log("after the delete functions,");

        //ONCE WE FINISH deleting the leaves, we start adding the new ones
        //if lucca leaves are not in fitnet leaves, this means that we need to add them to fitnet
        newLeavesToAdd = MainFunctions.difference(ACPT_LUCCA_LEAVES_trans, FITNET_LEAVES_trans)
        console.log("leaves to add to fitnet: ", newLeavesToAdd);
        await addLeaves(newLeavesToAdd, user)
        console.log('you should see this after we finish updating the leave requests for each user');
    }
    else {
        console.log("No changes, the user did not update his vacations yet.");
    }*/
}


async function getIdsToDelete(arr, fitnetLeaves) {
    let tempArray = []
    for (const toDeleteLeave of arr) {
        for (const obj of fitnetLeaves) {
            if (
                (obj.beginDate === toDeleteLeave.startDate )
                &&
                ( obj.endDate === toDeleteLeave.endDate)
                &&
                (obj.startMidday === toDeleteLeave.isMidDay)
                &&
                (obj.endMidday === toDeleteLeave.isEndDay)
            ) {
                tempArray.push(obj.leaveId)
            }
        }

    }
    return tempArray;
}

async function addLeaves(arr, user) {
    for (const luccaLeave of arr) {
        await new Promise(r => addLuccaLeave(luccaLeave, user, r));
    }
}
function addLuccaLeave(luccaLeave, user, r) {
    let luccaLeaveToFitnet = {
        "employeeId": user.id,
        "employee": "",
        "email": user.login,
        "typeId": StaticValues.LEAVE_TYPE,
        "beginDate": luccaLeave.startDate,
        "endDate": luccaLeave.endDate,
        "startMidday": luccaLeave.isMidDay,
        "endMidday": luccaLeave.isEndDay
    }
    // setTimeout(() => {
    //     console.log("user added successfully", luccaLeaveToFitnet);
    // }, 2000);
    FitnetManagerService.fitnetPostLeave(luccaLeaveToFitnet)
    r();
}
async function deleteLeaves(ids) {
    for (const id of ids) {
        await new Promise(r => fitnetDeleteLeave(id, r));
    }
}
function fitnetDeleteLeave(id, r) {
    setTimeout(() => {
        console.log("id deleted", id);
        FitnetManagerService.fitnetDeleteLeave(id);
        r();
    }, 2000);
}

//first function to execute
async function initialize() {
    /*
    const cron = require('node-cron');
    cron.schedule(StaticValues.scheduled_date, async () => {
        var users = await getUsers();
        for (const user of users?.data?.items) {
            console.log("user", user);
            // if (user.id == 1583) {
            //     await new Promise(r => integrator(user, r));
            // }
        }
        console.log('finished looping!');
    });*/


// testing
    var users = await getUsers();
    var idento_users = _.filter(users?.data?.items, function(element){ return element.mail.includes('idento'); })
    for (const user of idento_users) {
        if (user.id == 1583) {
            await new Promise(r => integrator(user, r));
        }
    }
}
async function integrator(user, r) {
    minDate = Helper.getTodaysDate();
    maxDate = Helper.getDateInFourMonths();
    month = Helper.getMonth();
    year = Helper.getYear();

    await updateLeaves(user, minDate, maxDate, month, year);
    console.log('i waited until we got out of the if statment');
    r();
}

function getUsers() {
    return LuccaService.getUsers().then(response => response.json());
}
//initial function
initialize();

app.listen(process.env.PORT || 8088, function () {
})

//functions
//***********************************************************************************************************************/
