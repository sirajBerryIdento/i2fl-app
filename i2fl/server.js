const StaticValues = require('./i2fl_folders/enums/StaticValues.enum')
const LuccaService = require("./i2fl_folders/services/luccaService");
const MainFunctions = require("./i2fl_folders/main_functions/MainFunctions");
const express = require('express')
const app = express()
var _ = require('underscore')._;
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
LeaveType = StaticValues.LEAVE_TYPE;




async function updateLeaves(user) {
    var map = new Map();
    leaves = await MainFunctions.getAcceptedLuccaLeaves(user);
    map = leaves[0]
    src = leaves[1]
    src.sort(function (a, b) {
        return new Date(a) - new Date(b)
    })
    //get leave objects
    const ACPT_LUCCA_LEAVES = src.reduce((res, date, idx, self) => {
        const rangeStart = !idx || new Date(date) - new Date(self[idx - 1]) > (864e5 / 2),
            rangeEnd = idx == self.length - 1 || new Date(self[idx + 1]) - new Date(date) > (864e5 / 2)
        if (rangeStart) res.push({ startDate: date, endDate: date })
        else if (rangeEnd) res[res.length - 1]['endDate'] = date
        return res
    }, []);
    ACPT_LUCCA_LEAVES_trans = await MainFunctions.transform(ACPT_LUCCA_LEAVES, StaticValues.IsLuccaFormat, map);
    console.log("lucca leaves delivered, check fitnet leaves now");
    const FITNET_LEAVES = await MainFunctions.getFitnetLeaves();
    FITNET_LEAVES_trans = await MainFunctions.transform(FITNET_LEAVES, StaticValues.IsFitnetFormat, null);
    console.log("fitnet leaves delivered, check if they are identical now");

    identical = _.isEqual(FITNET_LEAVES_trans, ACPT_LUCCA_LEAVES_trans);

    if (!identical) {
        //first we need to delete the leaves
        let idsToDelete = []
        //if the leaves in fitnet are no longer in lucca, this means that we need to deltet them from lucca
        oldLeavesToDelete = MainFunctions.difference(FITNET_LEAVES_trans, ACPT_LUCCA_LEAVES_trans)
        idsToDelete = await getIdsToDelete(oldLeavesToDelete, FITNET_LEAVES);
        console.log("leaves to delete from fitnet: ", idsToDelete);
        await deleteLeaves(idsToDelete);
        console.log("after the delete functions,");

        //ONCE WE FINISH deleting the leaves, we start adding the new ones
        //if lucca leaves are not in fitnet leaves, this means that we need to add them to fitnet
        newLeavesToAdd = MainFunctions.difference(ACPT_LUCCA_LEAVES_trans, FITNET_LEAVES_trans)
        console.log("leaves to add to fitnet: ", newLeavesToAdd);
        addLeaves(newLeavesToAdd, user)
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
                (Date.parse(obj.beginDate) === Date.parse(toDeleteLeave.startDate))
                &&
                (Date.parse(obj.endDate) === Date.parse(toDeleteLeave.endDate))
                &&
                (obj.startMidday === toDeleteLeave.isMidDay)
                &&
                (obj.endMidday === toDeleteLeave.isEndDay)
            ) {
                tempArray.push(o.leaveId)
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
        "employeeId": user.id, // check this
        "employee": "",
        "email": user.data.login,
        "typeId": StaticValues.LEAVE_TYPE,
        "beginDate": luccaLeave.startDate,
        "endDate": luccaLeave.endDate,
        "startMidday": luccaLeave.isMidDay,
        "endMidday": luccaLeave.isEndDay
    }
    setTimeout(() => {
        console.log("user added successfully", luccaLeaveToFitnet);
    }, 2000);
    // FitnetManagerService.fitnetPostLeave(luccaLeaveToFitnet)
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
        // FitnetManagerService.fitnetDeleteLeave(id);
        r();
    }, 2000);
}

//first function to execute
async function initialize() {
    var users = await getUsers();
    for (const user of users?.data?.items) {
        if (user.id == 1583) {// is statment is only for testing: only for testing 
            await new Promise(r => integrator(user, r));
        }
    }
    console.log('finished looping');
    // updateLeaves();
}

async function integrator(user, r) {

    //just test it now on siraj: id 1583
    let userMail = await getUserMail(user.url);
    console.log("usermail ", userMail.data.login, userMail.data.mail); // to be used in the mail property 
    await updateLeaves(userMail);
    console.log('i waited until we got out of the if statment');
    r();
}
function getUserMail(url) {
    return LuccaService.getURL(url).then(response => response.json());
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
