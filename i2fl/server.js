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




async function updateLeaves(user, month, year) {
    var AMPMOftheDays = new Map(); //will be used to decide if the leave object starts or ends with a half day
    var leaves = await MainFunctions.getAcceptedLuccaLeaves(user, month, year);
    AMPMOftheDays = leaves[0]// gets sets of AM,PM arrays for each date
    var listLuccaLeaveDates = Helper.sortArray(leaves[1]);
    //get lucca leave objects
    var ACPT_LUCCA_LEAVES = Helper.getLuccaLeavesObj(listLuccaLeaveDates); // gets all leave requests as objects, object: from start to end date
    var ACPT_LUCCA_LEAVES_trans = await MainFunctions.transform(ACPT_LUCCA_LEAVES, StaticValues.IsLuccaFormat, AMPMOftheDays); // transform lucca leaves to the common form
    console.log("ACPT_LUCCA_LEAVES_trans",ACPT_LUCCA_LEAVES_trans);
    //*************************

    var FITNET_LEAVES = await MainFunctions.getFitnetLeaves(month, year);// get fitnet leaves in a given month and year
    var returned_fitnet_Leaves = [] // used to get fitnet leaves submitted after the static date: STARTING_DATE_LIVE_FITNET
    if(FITNET_LEAVES.status==200 || FITNET_LEAVES.length>0) {
        for (const element of FITNET_LEAVES) {
            if(
                new Date(element.askingDate)> new Date(StaticValues.STARTING_DATE_LIVE_FITNET) 

            ){// ignore all fitnet leave requests submitted before the static date: STARTING_DATE_LIVE_FITNET  
                returned_fitnet_Leaves.push(element);
            }
        }
    }
    var FITNET_LEAVES_trans = await MainFunctions.transform(returned_fitnet_Leaves, StaticValues.IsFitnetFormat, null); // transform fitnet leaves to the common form
    
    // sort the arrays in ascending order: to be able to compare them in the identical function
    FITNET_LEAVES_trans = FITNET_LEAVES_trans.sort((objA, objB) => Number(returnDate(objA.startDate)) - Number(returnDate(objB.startDate)),);
    ACPT_LUCCA_LEAVES_trans = ACPT_LUCCA_LEAVES_trans.sort((objA, objB) => Number(returnDate(objA.startDate)) - Number(returnDate(objB.startDate)),);
    //******************** Compare them here 
    identical = _.isEqual(FITNET_LEAVES_trans, ACPT_LUCCA_LEAVES_trans);
    console.log("identical",identical);
    
    
    if (!identical) {
        //first we need to delete the leaves in fitnet: the user deleted them from lucca so they should no longer appear in fitnet
        let idsToDelete = []// fitnet delete api takes the id as attribute so we need to collect the ids to delete them first
        
        //if the leaves in fitnet are no longer in lucca, this means that we need to delete them from lucca
        var oldLeavesToDelete = MainFunctions.difference(FITNET_LEAVES_trans, ACPT_LUCCA_LEAVES_trans)
        if(oldLeavesToDelete.length>0) {
            idsToDelete = await getIdsToDelete(oldLeavesToDelete, FITNET_LEAVES);// takes the fitnet objects from the fitnet array with the common format and cmpare them to the array with the fitnet format
            console.log("leaves to delete from fitnet: ", idsToDelete);
            await deleteLeaves(idsToDelete);
        }
        console.log("after the delete functions,");

        //ONCE WE FINISH deleting the leaves, we start adding the new ones
        //if lucca leaves are not in fitnet leaves, this means that we need to add them to fitnet
        var newLeavesToAdd = MainFunctions.difference(ACPT_LUCCA_LEAVES_trans, FITNET_LEAVES_trans)
        console.log("leaves to add to fitnet: ", newLeavesToAdd);
        await addLeaves(newLeavesToAdd, user)
        console.log('you should see this after we finish updating the leave requests for each user');
    }
    else {
        console.log("No changes, the user did not update his vacations yet.");
    }
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
function returnDate(date) {//  "26/08/2022"
	let splitted = date.split("/"); //["26","08","2022"]
	return new Date( Number(splitted[2]), Number(splitted[1]), Number(splitted[0]))
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
    FitnetManagerService.fitnetPostLeave(luccaLeaveToFitnet).then(res=>{ console.log("user added successfully", res);}).catch(err=>{console.log("err: ",err);});

    r();
}
async function deleteLeaves(ids) {
    for (const id of ids) {
        await new Promise(r => fitnetDeleteLeave(id, r));
    }
}
function fitnetDeleteLeave(id, r) {
    FitnetManagerService.fitnetDeleteLeave(id).then(res=>{console.log("id deleted", id)}).catch(err=>{console.log("error while deleting: ",err);});
    r();
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
    let month = Helper.getMonth();// current month
    let year = Helper.getYear();// current year

    await updateLeaves(user, month, year);
    console.log('I waited until we got out of the if statment');
    r();
}

function getUsers() {
    return LuccaService.getUsers().then(response => response.json());
}
//initial function
initialize();

app.listen(process.env.PORT || 8088, function () {
})