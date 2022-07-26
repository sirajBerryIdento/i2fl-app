function getDateFromId(data) {
    return data.id.split("-")[1];
}
function transformToDateFormat(date) { //returns this format: dd-MM-yyyy
    return date.substring(6, 8) + "/" + date.substring(4, 6) + "/" + date.substring(0, 4);
}
function isHalfDay(luccaLeaves, id) {
    var instanceId = id.split("-");
    instanceId = instanceId[0] + "-" + instanceId[1];
    var counter = 0;
    luccaLeaves.forEach((leave) => {
        if (leave.id.includes(instanceId)) {
            counter++
        }
    });

    if (counter == 2) { //PM and AM
        return false;
    }
    counter = 0;
    return true;
}
//yyyy-MM-dd to dd/MM/yyyy
function luccaToFitnetDateConvertor(day, month, year) {
    console.log('day, month, year: ',day, month, year);
    return ((day > 9) ? day : '0' + day) + "/" + ((month > 9) ? month : '0' + month) + "/" + year;
}
function isAm (id) {
    r = id.split('-')[2];
    return r==='AM' ;
}

module.exports = { getDateFromId, transformToDateFormat,isHalfDay, luccaToFitnetDateConvertor, isAm};


//might be hemperful in the future
function countingConsecutiveLeaves(a) {
    queue = [];
    ff = null;
    allConsecutive = true;
    if (a != null && a.length > 2) {
        for (let i = 0; i < a.length; i++) {
            tf = a[i];
            ts = a[i + 1];
            if (ff == null) {
                ff = tf;
            }
            if ( !(Date.parse(ts) - Date.parse(tf) === 86400000) ) {//change here
                obj = new Leave(ff, a[i])
                queue.push(obj);
                ff = null;
                allConsecutive = false;
            }
            else if((Date.parse(ts) - Date.parse(tf) === 86400000) && (i==a.length-2)) {//change here
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
            if (Date.parse(ts) - Date.parse(tf) === 86400000) {
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