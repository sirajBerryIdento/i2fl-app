const FitnetLeave = require('./i2fl_folders/_models/Fitnet.model')
const Leave = require('./i2fl_folders/_models/Leave.model')

const StaticValues = require('./i2fl_folders/enums/StaticValues.enum')
const Helper = require("./i2fl_folders/helper/Helper");
const LuccaService = require("./i2fl_folders/services/luccaService");
const FitnetManagerService = require("./i2fl_folders/services/fitnetManagerService");
const express = require('express')
const app = express()
const fetch = require("node-fetch-commonjs");

var getLuccaLeaves = null;
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

LeaveType = StaticValues.LEAVE_TYPE;


const INDEX = "\\Index.html";
app.get('/', function (req, res) {
    res.send(__dirname + INDEX);
})


var dateParam, dateStart, dateEnd, isCancelled, minDate, maxDate,ownerId;
var queue = []
minDate = "2022-09-05";
maxDate = "2022-10-04";
app.post('/integrate', function (req, res) {
    payload = res.req.body;
    ownerId = payload.owner.id;
    email = "siraj.berry@idento.fr";

    isCancelled = payload.isCancelled;

    if (dateStart === '') {
        dateStart = res.req.body.date;
    }
    dateEnd = res.req.body.date;
    dateParam = 'between,' + dateStart + ',' + dateEnd;
    res.json(res.req.body)
})

function callback() {
    setTimeout(() => {
        if (isCancelled) { // user wants to delete a vacation
            deleteLeave(dateStart);
        }
        else { // user is adding a vacation
            getLuccaLeaves = LuccaService.getLeavesAPI(ownerId, dateParam, StaticValues.PAGING);
            getLuccaLeaves.then(response => response.json())
                .then(leaves => {
                    if (leaves) {
                        luccaLeaves = leaves?.data?.items;
                        integrator(luccaLeaves, email);
                    }
                })
        }
    }, 0);
}
function reInitializeVariables() {
    dateStart = '';
    dateEnd = '';
    dateParam = '';

}
//first function to execute
function initialize() {
    reInitializeVariables();
    setInterval(() => {
        if (!(minDate === '')  && !(maxDate === '') ) {
            dateParam = 'between,' + minDate + ',' + maxDate;
            getLuccaLeaves = LuccaService.getLeavesAPI(ownerId, dateParam, StaticValues.PAGING);
            getLuccaLeaves.then(response => response.json())
            .then(leaves => {
                // create a map for this id - object
                // get all keys: [20221012, 20221013, 20221014,     20220919,20220920,20220921,    20221019,20221020,20221003, 20221004]
                // create LeaveRequest Object and add it to the queue, its object has the following properties: startdate, enddate, type


                //while queue is not looped over it totally
                    // callback(q[i])
            })
            // callback();
        }
        else {
            console.log('dateParam still empty', dateParam);
        }
    }, 1000);
}
function countingConsecutiveLeaves(a) {
    queue = [];
    ff = 0;
    allConsecutive = true;
    if (a != null && a.length > 2) {
        for (let i = 0; i < a.length; i++) {
            tf = a[i];
            ts = a[i + 1];
            if (ff == 0) {
                ff = tf;
            }
            if (ts - tf != 1) {
                obj = new Leave(ff, a[i])
                queue.push(obj);
                ff = 0;
                allConsecutive = false;
            }
            else if(((ts - tf) == 1) && (i==a.length-2)) {
                obj = new Leave(ff, ts)
                allConsecutive = false;
                queue.push(obj);
            }
            if (allConsecutive && i == (a.length - 2)) {
                obj = new Leave(ff, a[a.length - 1])
            }
        }
    }
    else {
        if (a != null && a.length == 2) {
            tf = a[0]
            ts = a[1]
            if (ts - tf == 1) {
                obj = new Leave(tf, ts)
                queue.push(obj)
            }
            else {
                obj1 = new Leave(tf, tf)
                queue.push(obj1)

                obj2 = new Leave(ts, ts)
                queue.push(obj2)
            }
        }
        else if (a != null &&  a.length == 1) {
            tf = a[0]
            ts = a[1]
            obj = new Leave(tf, ts)
            queue.push(obj)
        }
        else {
            console.log('null array')
        }
    }
    queue = queue.filter((thing, index) => {
        const _thing = JSON.stringify(thing);
        return index === queue.findIndex(obj => {
          return JSON.stringify(obj) === _thing;
        });
      })
    console.log("queue: ", queue)
    queue = [];
    allConsecutive = true;
}
//initial function
initialize();

app.listen(process.env.PORT || 8088, function () {
    console.log("integrator server listening at 8088")
    a = [3,6,7,10,2,8,11,1,12,15]
    a= [1,2    ,4,5,6  ,11,12   ,14  ,16,17];
    a1= [11,12]
    a2 = [11,15]
    a3=[11,12,13]
    a4=[11  ,15,16  ,18]
    a5=null
    a6=[1,2,3,4,5]
    a7=[11,12,13,14]
    countingConsecutiveLeaves(a);
    countingConsecutiveLeaves(a1);
    countingConsecutiveLeaves(a2);
    countingConsecutiveLeaves(a3);
    countingConsecutiveLeaves(a4);
    countingConsecutiveLeaves(a5);
    countingConsecutiveLeaves(a6);
    countingConsecutiveLeaves(a7);
})

//functions
function integrator(luccaLeaves, email) {
    //case of half day
    if (luccaLeaves.length == 1) {
        halfDay = luccaLeaves[0];
        let d = Helper.getDateFromId(halfDay);
        halfDayDate = Helper.transformToDateFormat(d);
        var fitnetLeaveRequest1 = new FitnetLeave(email, LeaveType, halfDayDate, halfDayDate, Helper.isAm(halfDay.id), !Helper.isAm(halfDay.id))
        setLeaves(fitnetLeaveRequest1);
    }
    // case of full day
    else if (luccaLeaves.length == 2) {
        fullDay = luccaLeaves[0];

        let fd = Helper.getDateFromId(fullDay);
        fullDayDate = Helper.transformToDateFormat(fd);
        var fitnetLeaveRequest2 = new FitnetLeave(email, LeaveType, fullDayDate, fullDayDate, false, false);
        setLeaves(fitnetLeaveRequest2);
    }
    else if (luccaLeaves.length > 2) {
        var begin = luccaLeaves[0];
        var end = luccaLeaves[luccaLeaves.length - 1];

        var beginDate = Helper.getDateFromId(begin);
        beginDate = Helper.transformToDateFormat(beginDate);
        var endDate = Helper.getDateFromId(end);
        endDate = Helper.transformToDateFormat(endDate);

        var startMidday = Helper.isHalfDay(luccaLeaves, begin.id);
        var endMidday = Helper.isHalfDay(luccaLeaves, end.id);

        var fitnetLeaveRequest3 = new FitnetLeave(email, LeaveType, beginDate, endDate, startMidday, endMidday);
        setLeaves(fitnetLeaveRequest3);
    }
}

function deleteLeave(dateLeave) {
    splitLeaveDate = dateLeave.split("-");
    var companyId = StaticValues.COMPANY_ID;

    var year = Number(splitLeaveDate[0]);
    var month = Number(splitLeaveDate[1]);
    var day = Number(splitLeaveDate[2]);

    var luccaToFitnetDateFormat = Helper.luccaToFitnetDateConvertor(day, month, year);
    fitnetLeaveObj = FitnetManagerService.fitnetGetLeave(companyId, month, year);
    console.log("luccaToFitnetDateFormat", luccaToFitnetDateFormat)
    fitnetLeaveObj.then(response => response.json())
        .then(leaves => {
            if (leaves) {
                leaves.forEach(leave => {
                    console.log("leave: ", leave)
                    if (leave.beginDate === luccaToFitnetDateFormat) {
                        console.log("inside the if statment, id found is: ", leave.leaveId)
                        deleteLeavePromise = FitnetManagerService.fitnetDeleteLeave(leave.leaveId);
                        deleteLeavePromise.then((res) => {
                            console.log("leave request with id " + leave.leaveId + " was deleted successfully")
                            reInitializeVariables();
                        }).catch((error) => {
                            console.log("error: ", error);
                        });
                        console.log("inside")
                    }
                }
                );
            }
        })
    console.log("outside")
}

async function setLeaves(fitnetLeaveRequest) {
    const response = await fetch("https://evaluation.fitnetmanager.com/FitnetManager/rest/leaves/create", {
        method: 'POST',
        headers: {
            'Authorization': StaticValues.FITNET_ACESS_TOKEN,
            'Content-type': 'application/json; charset=UTF-8',

        },
        body: JSON.stringify(fitnetLeaveRequest),
    }).then((res) => {
        if (res.status == 200) {
            console.log("success this leave request was aded to fitnet", fitnetLeaveRequest)
        }
        else if (res.status == 500) {
            console.log("res", res)
        }
        else {
            console.log("res: ", res)
        }
    }).catch(
        (error) => {
            console.log("error: ", error);
        });
    reInitializeVariables();
}