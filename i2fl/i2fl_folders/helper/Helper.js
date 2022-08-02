function getDateFromString(data,split_by, index) {
    return data.split(split_by)[index];
}
function transformToDateFormat(date) {// 2022-09-06 to 06-09-2022(dd-mm-yyyy)
    let date_splitted = date.split('-');
    return date_splitted[2]+'-'+date_splitted[1]+'-'+date_splitted[0];
}
function toLuccaDateFormate(date){ //from 20220906 to result: 2022-09-06
    return date.substring(0, 4) + "-" + date.substring(4, 6) + "-" + date.substring(6, 8); 
}
//yyyy-MM-dd to dd/MM/yyyy
function luccaToFitnetDateConvertor(date) {
    let day = parseInt (getDateFromString(date, '-',0)) 
    let month = parseInt(getDateFromString(date, '-',1)) 
    let year = parseInt(getDateFromString(date, '-',2)) 
    return ((day > 9) ? day : '0' + day) + "/" + ((month > 9) ? month : '0' + month) + "/" + year;
}

module.exports = { getDateFromString, transformToDateFormat, luccaToFitnetDateConvertor, toLuccaDateFormate};
