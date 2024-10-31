// ********************************************
// package
// ********************************************

const express = require('express')
const bodyParser = require('body-parser');
const session = require('cookie-session');
const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const moment = require('moment');
const querystring = require("querystring");

// ********************************************
// variable
// ********************************************

const app = express()
const config = require('./models/config.js')
const loginAccount = require('./models/loginAccount.js')
const courseList = require('./models/courseList.js')
const districtList = require('./models/districtList.js')
const ejsFunc = {formatDate: formatDate}

// ********************************************
// Schema
// ********************************************

const StudentSchema = require('./models/StudentSchema.js')

// ********************************************
// init mongoose
// ********************************************

mongoose.connect(config.mongooseUrl);
const StudentModel = mongoose.model(config.studentCollectionName, StudentSchema)

// ********************************************
// init ejs
// ********************************************

app.set('view engine', 'ejs')

// ********************************************
// session
// ********************************************

app.use(session({
    name: "studInfoSysSesstion",
    keys: [config.SECRETKEY],
}))

// ********************************************
// middleware
// ********************************************

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use('/assets', express.static("public"))

app.use((req,res,next) => {
    console.log(req.method+":"+req.path)
    // console.log(req.headers.cookie.split('; '))
    next()
})

// ********************************************
// Function - General
// ********************************************

// ===== Format Date
function formatDate(date) {
    return moment(date).format("YYYY-MM-DD")
}

// ===== Alert List
function addAlertList(req, type, msg){
    if(req.session.pageAlert == null){
        req.session.pageAlert = []
    }
    req.session.pageAlert.push({'type': type, 'msg': msg});
}

function clearAlertList(req){
    req.session.pageAlert = []
}

// ===== Login Session
function checkLoginSession(req){
    return (req.session != null && req.session.authenticated)
}

function setLoginSession(req, client){
    req.session.authenticated = true
    req.session.client = client
}

function clearLoginSession(req){
    let alertList = req.session.pageAlert

    req.session = {}
    req.session.authenticated = false
    req.session.client = null
    req.session.pageAlert = alertList
}

// ===== Verify Login
function verifyLogined(req, res){
    if(checkLoginSession(req)){
        return true
    } else {
        addAlertList(req, 'danger', 'Please login first.')
        res.redirect('/login')
        return false
    }
}

// ===== User ID & Pwd Check
function compareLoginPwd(userId, userPwd){
    let client = null
    loginAccount.forEach((user) => {
        if (user.userId == userId && user.password == userPwd) {
            client = user
        }
    });
    return client
}

// ===== Format Page Info
function formatPageInfo(req){
    let info = {}
    info.session = Object.assign({}, req.session)
    info.config = config

    clearAlertList(req)

    return info
}

function studentSearchParams(params) {
    
    const query = { }

    if(params.studId != null && params.studId.length > 0){
        query.studId = params.studId
    }

    if(params.studName != null && params.studName.length > 0){
        query.studName = params.studName
    }

    if(params.bod != null && params.bod.length > 0){
        query.bod = params.bod
    }

    if(params.studyYear != null && params.studyYear.length > 0){
        query.studyYear = params.studyYear
    }

    if(params.district != null && params.district.length > 0){
        query.district = params.district
    }

    if(params.location != null && params.location.length > 0){
        query.location = params.location
    }

    if(params.courseCode && Array.isArray(params.courseCode) && params.courseCode.length > 0){
        let temp = []
        for(code of params.courseCode){
            if(code != null && code.length > 0){
                temp.push(code)
            }
        }
        if(temp.length > 0){
            query['courseCode[]'] = temp
        }
    }

    return query
}

// ********************************************
// Function - Page Action
// ********************************************

function actionLogin(req){
    let client = compareLoginPwd(req.body.userId, req.body.userPwd)

    if(client != null){
        setLoginSession(req, client)
    }

    return client
}

// ********************************************
// Function - DB Operation
// ********************************************

async function dbStudentSearch(params) {
    let result = {success: true, count: 0, data: null, err: null}
    try {
        const query = { }

        if(params.studId != null && params.studId.length > 0){
            query.studId = {$regex: params.studId, $options: 'i'}
        }

        if(params.studName != null && params.studName.length > 0){
            query.studName = {$regex: params.studName, $options: 'i'}
        }

        if(params.bod != null && params.bod.length > 0){
            query.bod = new Date(params.bod)
        }

        if(params.studyYear != null && params.studyYear.length > 0){
            query.startStudyYear = {$lte: parseInt(params.studyYear)}
            query.endStudyYear = {$gte: parseInt(params.studyYear)}
        }

        if(params.district != null && params.district.length > 0){
            query["address.district"] = params.district
        }

        if(params.location != null && params.location.length > 0){
            query["address.location"] = {$regex: params.location, $options: 'i'}
        }

        if(params.courseCode && Array.isArray(params.courseCode) && params.courseCode.length > 0){
            let temp = []
            for(code of params.courseCode){
                if(code != null && code.length > 0){
                    temp.push({courses: {$elemMatch: {courseCode: {$in: code}}}})
                }
            }
            if(temp.length > 0){
                query['$and'] = temp
            }
        }

        result.data = await StudentModel.find(query).exec();
        result.count = result.data.length
    } catch (err) {
        result.err = err.toString()
        result.success = false
    } finally {
        return result
    }
}

async function dbStudentFindOne(studId) {
    let result = {success: true, count: 0, data: null, err: null}
    const query = { 'studId': studId }

    try {
        result.data = await StudentModel.findOne(query).exec()
        if(result.data == null) {
            throw new Error('Student not found')
        } else {
            result.count = 1
        }
    } catch (err) {
        result.err = err.toString()
        result.success = false
    } finally {
        return result
    }
}

async function dbStudentCountByStudId(studId) {
    const query = { 'studId': studId }
    return await StudentModel.find(query).countDocuments().exec()
}

async function dbStudentAdd(data) {
    let result = {success: true, count: 0, data: null, err: null}

    let dataObj = {
        studId: data.studId,
        studName: data.studName,
        bod: data.bod,
        startStudyYear: data.startStudyYear,
        endStudyYear: data.endStudyYear,
        courses: [],
        address: {district: data.district, location: data.location},
    }

    dataObj = studentCourseCodeInserter(data, dataObj);

    try {
        const existCount = await dbStudentCountByStudId(dataObj.studId)

        if(existCount == 0){
            const studentObj = new StudentModel(dataObj);

            await studentObj.validate();

            studentObjectCheck(studentObj);

            result.data = await studentObj.save()
            result.count = 1
        } else {
            throw new Error('Student ID is exist.')
        }

    } catch (err) {
        result.err = err.toString()
        result.success = false
    } finally {
        return result
    }
}

async function dbStudentEdit(studId, data) {
    let result = {success: true, count: 0, data: null, err: null}
    const query = { 'studId': studId }
    try {
        let studentObj = await StudentModel.findOne(query).exec()

        if(studentObj != null) {
            if(data.studName != null){ studentObj.studName = data.studName }
            // else { studentObj.studName = null }
            if(data.bod != null){ studentObj.bod = data.bod }
            // else { studentObj.bod = null }
            if(data.startStudyYear != null){ studentObj.startStudyYear = data.startStudyYear }
            // else { studentObj.startStudyYear = null }
            if(data.endStudyYear != null){ studentObj.endStudyYear = data.endStudyYear }
            // else { studentObj.endStudyYear = null }
            if(data.district != null){ studentObj.address.district = data.district }
            // else { studentObj.address.district = null }
            if(data.location != null){ studentObj.address.location = data.location }
            // else { studentObj.address.location = null }

            studentObj = studentCourseCodeInserter(data, studentObj);

            await studentObj.validate();

            studentObjectCheck(studentObj);

            result.data = await studentObj.save();
            result.count = 1
        } else {
            throw new Error('Student not found')
        }
    } catch (err) {
        result.err = err.toString()
        result.success = false
    } finally {
        return result
    }
}

async function dbStudentDelete(studId) {
    let result = {success: true, count: 0, data: null, err: null}
    const query = { 'studId': studId }
    try {
        const res = await StudentModel.deleteOne(query);
        result.count = res.deletedCount
        if(result.count <= 0) {
            throw new Error('Student not found')
        }
    } catch (err) {
        result.err = err.toString()
        result.success = false
    } finally {
        return result
    }
}

async function dbStudentCourseFindOne(studId, courseCode) {
    let result = {success: true, count: 0, data: null, err: null}
    // const query = { 'studId': studId, 'courses': {$elemMatch: {'courseCode': courseCode}} }
    const query = [
        { $unwind : '$courses' },
        { $match : { 'studId': studId, 'courses.courseCode': courseCode }}
    ]

    try {
        result.data = await StudentModel.aggregate(query).exec()
        if(result.data.length > 0) {
            result.data = result.data[0]
            result.count = 1
        } else {
            throw new Error('Student / Course not Found')
        }
    } catch (err) {
        result.err = err.toString()
        result.success = false
    } finally {
        return result
    }
}

async function dbStudentCourseEdit(studId, courseCode, data) {
    let result = {success: true, count: 0, data: null, err: null}
    const query = { 'studId': studId, 'courses': {$elemMatch: {'courseCode': courseCode}} }
    try {
        if(data.score != null && data.score != ''){
            const studentObj = await StudentModel.findOne(query).exec()
    
            if(studentObj != null) {
                let objIdx = (studentObj.courses.findIndex((element) => element.courseCode == courseCode))
                if(objIdx >= 0) {
                    studentObj.courses[objIdx].score = data.score
            
                    await studentObj.validate();
                    let savedData = await studentObj.save();
                    result.data = savedData.courses[objIdx]
                    result.count = 1
                } else {
                    throw new Error('Course not Found')
                }
            } else {
                throw new Error('Student / Course not Found')
            }
        } else {
            throw new Error('Score required.')
        }

    } catch (err) {
        result.err = err.toString()
        result.success = false
    } finally {
        return result
    }
}

async function dbCourseCodeStatistic() {
    let result = {success: true, count: 0, data: null, err: null}

    const query = [
        { $unwind: "$courses" },
        { $match: { "courses.score": {$ne: null} } },
        { $group: { _id: "$courses.courseCode", count: { $sum: 1 }, average: { $avg: "$courses.score" }, highest: { $max: "$courses.score" }, minimum: { $min: "$courses.score" } } },
        // { $match: { _id: courseCode } },
        { $project: { _id: 0, courseCode: "$_id", count: "$count", average: "$average", highest: "$highest", minimum: "$minimum" } },
        // { $lookup: {from: "movies", localField: "movie_id", foreignField: "_id", as: "movie_details" } },
        // { $limit: 100 }
    ]
    try {
        const resultList = await StudentModel.aggregate(query).exec()

        result.data = []

        courseList.forEach((row, idx) => {
            let temp = resultList.find((element) => element.courseCode == row)
            if(temp == null) { temp = {average: 0, count: 0, highest: 0, minimum: 0} }
    
            result.data.push({courseCode: row, average: temp.average, highest: temp.highest, minimum: temp.minimum})
        })

        result.count = result.data.length
    } catch (err) {
        result.err = err.toString()
        result.success = false
    } finally {
        return result
    }
}

function studentCourseCodeInserter (data, dataObj) {
    // if(data.courseCode != null && Array.isArray(data.courseCode) && data.courseCode.length > 0) {
    //     data.courseCode.forEach((row) => {
    //         dataObj.courses.push({ 'courseCode': row, 'score': null })
    //     })
    // }

    if(data.courseCode != null && Array.isArray(data.courseCode)) {
        if(data.courseCode.length == 0){
            throw new Error('Course Code can\'t empty')
        }
        courseList.forEach((row) => {
            const objIdx = (dataObj.courses.findIndex((element) => element.courseCode == row))
            const isSelected = data.courseCode.includes(row)
            // console.log(objIdx, isSelected)
            if(objIdx >= 0 && !isSelected) {
                dataObj.courses.splice(objIdx, 1);
            } else if(objIdx < 0 && isSelected) {
                dataObj.courses.push({ 'courseCode': row, 'score': null })
            }
        })
    }

    return dataObj;
}

function studentObjectCheck (studentObj) {
    if(studentObj.courses.length == 0){
        throw new Error('Courses can\'t empty')
    }

    if(parseInt(studentObj.startStudyYear) >= parseInt(studentObj.endStudyYear)){
        throw new Error('Study Year (Start) must lass than Study Year (End)')
    }
}

// ********************************************
// connection - CURD
// ********************************************

// ===== Home Page
app.get('/', function(req,res){
    if(checkLoginSession(req)){
        res.redirect('/home')
    } else {
        res.redirect('/login')
    }
})

// ===== Login Page
app.get('/login', function(req,res) {
    if(checkLoginSession(req)){
        res.redirect('/home')
    }

    let pageInfo = formatPageInfo(req)
    res.render("login", {pageInfo : pageInfo, func: ejsFunc, pageName: 'Login'})
    res.end();
})

app.post('/login', (req,res) => {
    if(checkLoginSession(req)){
        res.redirect('/home')
    }

    let client = actionLogin(req)

    if(client != null){
        addAlertList(req, 'success', 'Account has been login.')

        res.redirect('/home')
    } else {
        addAlertList(req, 'danger', 'User ID or Password incorrect')

        res.redirect('/login')
    }
});

// ===== Logout Page
app.get('/logout', (req,res) => {
    // verifyLogined(req, res)
    
    clearLoginSession(req)

    // addAlertList(req, 'success', 'Account has been logout.')

    let pageInfo = formatPageInfo(req)
    res.render("logout", {pageInfo : pageInfo, func: ejsFunc, pageName: 'Logout'})
    res.end();
	// res.redirect('/login');
});

// ===== Welcome Page
app.get('/home', function(req,res) {
    verifyLogined(req, res)

    let pageInfo = formatPageInfo(req)
    
    res.render("welcome", {pageInfo : pageInfo, func: ejsFunc, pageName: 'Home'});
    res.end();
})

// ===== Student - List
app.get('/studentInfo', async function(req,res) {
    verifyLogined(req, res)

    let pageNo = parseInt(req.query.page) || 1
    let recordLimit = 10
    let recordOffset = 0
    let totalPage = 0
    let totalCount = 0

    if (pageNo < 1) {pageNo = 1;}

    let pageInfo = formatPageInfo(req)
    let searchData = req.query

    let formData = await dbStudentSearch(searchData)
    let resultList = formData.data

    totalCount = formData.count
    totalPage = Math.ceil(totalCount / recordLimit)

    if (pageNo > totalPage) {pageNo = totalPage;}

    recordOffset = (pageNo - 1) * recordLimit

    resultList = resultList.slice(recordOffset, (recordOffset * recordLimit) + recordLimit)

    const pageLink = []
    let previousLink = null
    let nextLink = null

    let queryStringArr = studentSearchParams(searchData)
    let queryStringStr = '&'+querystring.stringify(queryStringArr)

    console.log(queryStringArr)

    if(resultList.length > 0){
        if((pageNo - 2) >= 1){
            pageLink.push({'name': (pageNo - 2), 'link': '/studentInfo?page='+(pageNo - 2)+queryStringStr, 'selected': false})
        }
        if((pageNo - 1) >= 1){
            pageLink.push({'name': (pageNo - 1), 'link': '/studentInfo?page='+(pageNo - 1)+queryStringStr, 'selected': false})
            previousLink = '/studentInfo?page='+(pageNo - 1)+queryStringStr
        }
        pageLink.push({'name': pageNo, 'link': '/studentInfo?page='+(pageNo)+queryStringStr, 'selected': true})
        if((pageNo + 1) <= totalPage){
            pageLink.push({'name': (pageNo + 1), 'link': '/studentInfo?page='+(pageNo + 1)+queryStringStr, 'selected': false})
            nextLink = '/studentInfo?page='+(pageNo + 1)+queryStringStr
        }
        if((pageNo + 2) <= totalPage){
            pageLink.push({'name': (pageNo + 2), 'link': '/studentInfo?page='+(pageNo + 2)+queryStringStr, 'selected': false})
        }
    }

    const paginationData = {'totalCount': totalCount, 'page': pageNo, 'pageLink': pageLink, 'previousLink': previousLink, 'nextLink': nextLink}

    res.render("studentList", {pageInfo : pageInfo, func: ejsFunc, pageName: 'Student List', courseList: courseList, districtList: districtList, searchData: searchData, resultList: resultList, paginationData: paginationData});
    res.end();
})

// ===== Student - Detail
app.get('/studentInfo/view/:studId', async function(req,res) {
    verifyLogined(req, res)

    let pageInfo = formatPageInfo(req)

    let formData = await dbStudentFindOne(req.params.studId)

    if(formData.success){
        res.render("studentView", {pageInfo : pageInfo, func: ejsFunc, pageName: 'View Student', courseList: courseList, districtList: districtList, formData: formData.data});
    } else {
        res.render("studentNotFound", {pageInfo : pageInfo, func: ejsFunc, pageName: 'View Student'});
    }

    res.end();
})

// ===== Student - Detail
app.get('/course/statistic', async function(req,res) {
    verifyLogined(req, res)

    let pageInfo = formatPageInfo(req)

    let formData = await dbCourseCodeStatistic()

    res.render("courseStatistic", {pageInfo : pageInfo, func: ejsFunc, pageName: 'Course Statistic', courseList: courseList, districtList: districtList, formData: formData.data});

    res.end();
})

// ===== Student - Add
app.get('/studentInfo/add', async function(req,res) {
    verifyLogined(req, res)

    let pageInfo = formatPageInfo(req)

    let formData = {address: {}}

    res.render("studentForm", {pageInfo : pageInfo, func: ejsFunc, pageName: 'Add Student', courseList: courseList, districtList: districtList, formType: 'add', formData: formData});
    res.end();
})

app.post('/studentInfo/add', async function(req,res) {
    verifyLogined(req, res)

    let pageInfo = formatPageInfo(req)

    let formData = await dbStudentAdd(req.body)

    if(formData.success){
        addAlertList(req, 'success', 'Account has been added.')
        res.redirect('/studentInfo/view/'+formData.data.studId)
    } else {
        addAlertList(req, 'danger', formData.err)
        res.redirect('/studentInfo')
    }
})

// ===== Student - Edit
app.get('/studentInfo/edit/:studId', async function(req,res) {
    verifyLogined(req, res)

    let pageInfo = formatPageInfo(req)

    let formData = await dbStudentFindOne(req.params.studId)

    if(formData.success){
        res.render("studentForm", {pageInfo : pageInfo, func: ejsFunc, pageName: 'Edit Student', courseList: courseList, districtList: districtList, formType: 'edit', formData: formData.data});
    } else {
        res.render("studentNotFound", {pageInfo : pageInfo, func: ejsFunc, pageName: 'Edit Student'});
    }
    res.end();
})

app.post('/studentInfo/edit/:studId', async function(req,res) {
    verifyLogined(req, res)

    let pageInfo = formatPageInfo(req)

    let formData = await dbStudentEdit(req.params.studId, req.body)

    if(formData.success){
        addAlertList(req, 'success', 'Account has been edited.')
        res.redirect('/studentInfo/view/'+formData.data.studId)
    } else {
        addAlertList(req, 'danger', formData.err)
        res.redirect('/studentInfo')
    }
})

// ===== Student - Delete
app.get('/studentInfo/delete/:studId', async function(req,res){
    verifyLogined(req, res)

    let pageInfo = formatPageInfo(req)

    let formData = await dbStudentFindOne(req.params.studId)

    if(formData.success){
        res.render("studentDelete", {pageInfo : pageInfo, func: ejsFunc, pageName: 'Delete Student', formData: formData.data});
    } else {
        res.render("studentNotFound", {pageInfo : pageInfo, func: ejsFunc, pageName: 'Delete Student'});
    }
    res.end();
})

app.post('/studentInfo/delete/:studId', async function(req,res){
    verifyLogined(req, res)

    let pageInfo = formatPageInfo(req)

    let formData = await dbStudentDelete(req.params.studId)

    if(formData.success){
        addAlertList(req, 'success', 'Account has been deleted.')
    } else {
        addAlertList(req, 'danger', formData.err)
    }

    res.redirect('/studentInfo')
})

// ===== Student - Edit Course
app.get('/studentInfo/edit/:studId/course/:courseId', async function(req,res) {
    verifyLogined(req, res)

    let pageInfo = formatPageInfo(req)

    let formData = await dbStudentCourseFindOne(req.params.studId, req.params.courseId)

    if(formData.success){
        res.render("studentCourseForm", {pageInfo : pageInfo, func: ejsFunc, pageName: req.params.courseId + ' - Edit Course', courseList: courseList, formType: 'edit', formData: formData.data});
    } else {
        res.render("studentNotFound", {pageInfo : pageInfo, func: ejsFunc, pageName: req.params.studId + ' - Edit Course'});
    }
    res.end();
})

app.post('/studentInfo/edit/:studId/course/:courseId', async function(req,res) {
    verifyLogined(req, res)

    let pageInfo = formatPageInfo(req)
    let formData = await dbStudentCourseEdit(req.params.studId, req.params.courseId, req.body)

    if(formData.success){
        addAlertList(req, 'success', 'Course has been updated.')
        res.redirect('/studentInfo/view/'+req.params.studId)
    } else {
        addAlertList(req, 'danger', formData.err)
        res.redirect('/studentInfo/view/'+req.params.studId)
    }
})

// ********************************************
// connection - Restful
// ********************************************

// ===== Student - Search
app.get('/api/studentInfo', async function(req,res) {
    let resultList = await dbStudentSearch(req.query)
    res.status(200).json({success: resultList.success, count: resultList.count, data: resultList.data, error: resultList.err}).end();
})

// ===== Student - Detail
app.get('/api/studentInfo/:studId', async function(req,res) {
    let formData = await dbStudentFindOne(req.params.studId)
    res.status(200).json({success: formData.success, data: formData.data, error: formData.err}).end();
})

// ===== Student - Add
app.post('/api/studentInfo', async function(req,res) {
    let formData = await dbStudentAdd(req.body)
    res.status(200).json({success: formData.success, count: formData.count, error: formData.err}).end();
})

// ===== Student - Edit
app.put('/api/studentInfo/:studId', async function(req,res) {
    let formData = await dbStudentEdit(req.params.studId, req.body)
    res.status(200).json({success: formData.success, count: formData.count, error: formData.err}).end();
})

// ===== Student - Delete
app.delete('/api/studentInfo/:studId', async function(req,res) {
    let formData = await dbStudentDelete(req.params.studId)
    res.status(200).json({success: formData.success, count: formData.count, error: formData.err}).end();
})

// ===== Student - Course - Edit
app.put('/api/studentInfo/:studId/course/:courseId', async function(req,res) {
    let formData = await dbStudentCourseEdit(req.params.studId, req.params.courseId, req.body)
    res.status(200).json({success: formData.success, count: formData.count, error: formData.err}).end();
})

// =====  Course - Statistic
app.get('/api/course/statistic', async function(req,res) {
    let resultList = await dbCourseCodeStatistic()
    res.status(200).json({success: resultList.success, count: resultList.count, data: resultList.data, error: resultList.err}).end();
})

// =====  Form Check - StudId Unique
// url format was designed for [Jquery Validation] method call
// output format was followd [Jquery Validation] required
app.get('/checkStudIdUnique', async function(req,res) {
    let resultList = await dbStudentCountByStudId(req.query.studId)
    const result = (resultList == 0)?true:"Student ID is exist."
    res.status(200).json(result).end();
})

// ********************************************
// init server
// ********************************************

const server = app.listen(process.env.PORT || 3000, () => {
    const port = server.address().port;
    console.log(`Server is listening at port ${port}`); 
})