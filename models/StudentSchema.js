const mongoose = require('mongoose')

const courseList = require('./courseList.js')
const districtList = require('./districtList.js')

const StudentSchema = mongoose.Schema ({
  studId: { type: String, required: true, match: [/^(s)+(\d{7})$/, 'Student Id Format is s0000000']},
  studName: { type: String, required: true},
  bod: { type: Date, required: true},
  startStudyYear: {type: Number, required: true, min: 1000, max: 9999},
  endStudyYear: {type: Number, required: true, min: 1000, max: 9999},
  courses: [{ courseCode: { type: String, required: true, enum: courseList }, score: {type: Number, min: 0, max: 100} }],
  address: {district: { type: String, required: true, enum: districtList }, location: { type: String, required: true}},
})

module.exports = StudentSchema