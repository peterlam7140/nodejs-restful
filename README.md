# Student Score Management System

## Group Info

- xxx xxx xxx (00000000)

## System Info

This system aims to store student information and each score of course

## Package
- body-parser v1.20.2
- cookie-session v2.0.0
- ejs v3.1.9
- express v4.18.2
- moment v2.29.4
- mongodb v5.9.0
- mongoose v7.6.3
- nodemon v3.0.1

## Library
- jquery  v3.7.1
- Bootstrap  v5.3.2
- select2  v4.1.0-rc.0
- jquery-validation v1.19.5

## Data
- `Site Config` stored in `/models/config.js`
- `Course List` stored in `/models/courseList.js`
- `District List` stored in `/models/districtList.js`
- `Login Account` List stored in `/models/loginAccount.js`

## Schema
`Student Schema` stored in `/models/StudentSchema.js`

Student Record contain following attributes:

- studId
    - Name: `Student Id`
    - Type: `String`
    - Mandatory
    - Format: `s0000000`
- studName
    - Name: `Student Name`
    - Type: `String`
    - Mandatory
- bod
    - Name : `Day of Birth`
    - Type: `Date`
    - Mandatory
- startStudyYear
    - Name : `Study Year (Start)`
    - Type: `Number`
    - Mandatory
    - Data must be between `1000` to `9999`
- endStudyYear
    - Name : `Study Year (End)`
    - Type: `Number`
    - Mandatory
    - Data must be between `1000` to `9999`
- address
    - Name : `Address`
    - Type : `Object`
        1. district
            - Name : `District`
            - Type: `String`
            - Mandatory
            - Data must be `District List` enumerated
        2. location
            - Name : `Location`
            - Type: `String`
            - Mandatory
- Courses
    - Name : `Courses`
    - Type : `Array[Object]`
        1. courseCode
            - Name : `Course Code`
            - Type: `String`
            - Mandatory
            - Data must be `Course List` enumerated
        2. score
            - Name : `Score`
            - Type: `Number`
            - Not Mandatory
            - Data must be between `0` to `100`

## Login
PATH : `/login`

After login with `userId` and `password`, user can access all the function in system.

After login success, user info will stored via `cookie-session`.

Here are all account information:

````
{'userId': 'editor1', 'userName': 'Peter Lam', 'password': 'pwd1'}

{'userId': 'editor2', 'userName': 'Eric Chan', 'password': 'pwd2'}

{'userId': 'editor3', 'userName': 'Grey Lee', 'password': 'pwd3'}

{'userId': 'editor4', 'userName': 'Henry Ho', 'password': 'pwd4'}

{'userId': 'editor5', 'userName': 'Alex Tso', 'password': 'pwd5'}
````

## Logout
PATH : `/logout`

User can click `logout` button in navigation bar to execute logout action.
If user logout system, login session will be deleted.

## CRUD service

### CRUD service - View Student List
PATH : `/studentInfo`

- In this page, all student record will list here.

- User allowed to use stored student information to filter student.

- If user click `View` button in course row, will go to `View student detail` page.

- If user click `Add` button in page bottom, will go to `Add student information` page.

#### Search fields
| Field Name    | Description                                        | Format       |
| ------------- | -------------------------------------------------- | ------------ |
| Student Id    | Search student by Student Id                       |              |
| Student Name  | Search student by Student Name                     |              |
| Date of Birth | Search student by Date of Birth                    | YYYY-MM-DD   |
| Study Year    | Search student by between Study Year start and end | YYYY         |
| District      | Search student by District                         |              |
| Location      | Search student by Location                         |              |
| Courses Code  | Search student by Courses Code                     |              |

---
### CRUD service - View Student Detail
PATH : `/studentInfo/view/:studId`

- Selected student detail will shown here.

- If user click `Edit` button in course row, will go to `Edit student course` page.

- If user click `Edit` button in page bottom, will go to `Edit student information` page.

- If user click `Delete` button in page bottom, will go to `Delete student information` page.

- If user click `Back` button in page bottom, will go to `View student list` page.

---
### CRUD service - Add Student Information
PATH : `/studentInfo/add`

- User can create new student record after finish the form and click `Submit` button.

- Provided basic form validation via jquery-validation.

- If user click `Back` button in page bottom, will go to `View student list` page.

#### Form fields
| Field Name         | Format       | Required | Unique |
| ------------------ | ------------ | -------- | ------ |
| Student Id         | s0000000     | Y        | Y      |
| Student Name       |              | Y        | N      |
| Date of Birth      | YYYY-MM-DD   | Y        | N      |
| Study Year (Start) | YYYY         | Y        | N      |
| Study Year (End)   | YYYY         | Y        | N      |
| District           |              | Y        | N      |
| Location           |              | Y        | N      |
| Courses Code       |              | Y        | N      |

---
### CRUD service - Edit Student Information
PATH : `/studentInfo/edit/:studId`

- User can modify student record after click `submit` button.

- Provided basic form validation via jquery-validation.

- If user click `Back` button in page bottom, will go to `View student detail` page.

#### Form fields
| Field Name         | Format       | Required | Unique |
| ------------------ | ------------ | -------- | ------ |
| Student Name       |              | Y        | N      |
| Date of Birth      | YYYY-MM-DD   | Y        | N      |
| Study Year (Start) | YYYY         | Y        | N      |
| Study Year (End)   | YYYY         | Y        | N      |
| District           |              | Y        | N      |
| Location           |              | Y        | N      |
| Courses Code       |              | Y        | N      |

---
### CRUD service - Edit Student Course Score
PATH : `/studentInfo/edit/:studId/course/:courseCode`

- User can modify student course score after click `submit` button.

- Provided basic form validation via jquery-validation.

- If user click `back` button in page bottom, will go to `View student detail` page.

#### Form fields
| Field Name  | Format      | Required | Unique |
| ----------- | ----------- | -------- | ------ |
| Score       | 0 - 100     | Y        | N      |
---
### CRUD service - Delete Student Information
PATH : `/studentInfo/delete/:studId`

- User will access this page for conform which student will be delete.

- When user click `Yes` Button, will execute delete action

- If user click `No` button in page bottom, will go to `View student detail` page.

---
### CRUD service - View Course Statistic Information
PATH : `/course/statistic`

- View each course statistic information

- Output will rounds the Average Score to a one of decimals.

## Restful

### Restful - Get Student List
PATH : `/api/studentInfo`

HTTP request types : `GET`

- Request Student list

- User allowed to use stored student information to filter student.

#### URL Query parameters
| Parameters   | Description                                        | Format       |
| ------------ | -------------------------------------------------- | ------------ |
| studId       | Search student by Student Id                       |              |
| studName     | Search student by Student Name                     |              |
| bod          | Search student by Date of Birth                    | YYYY-MM-DD   |
| studyYear    | Search student by between Study Year start and end | YYYY         |
| district     | Search student by District                         |              |
| location     | Search student by Location                         |              |
| courseCode   | Search student by Courses Code                     | Array        |


#### CURL Sample
Get `All Student`
````
curl -X GET '/api/studentInfo'
````
`Student Id` include `10`
````
curl -X GET '/api/studentInfo?studId=10'
````
`Student Name` include `Carmen`
````
curl -X GET '/api/studentInfo?studName=Carmen'
````
`Date of Birth` is `1998-06-17`
````
curl -X GET '/api/studentInfo?bod=1998-06-17'
````
`Study Year` include `2016`
````
curl -X GET '/api/studentInfo?studyYear=2016'
````
`District` is `Kwun Tong`
````
curl -X GET '/api/studentInfo?district=Kwun%20Tong'
````
`Location` include `Centre`
````
curl -X GET '/api/studentInfo?location=Centre'
````
`Courses Code` have `COMP S265F` and `COMP S266F`
````
curl -X GET '/api/studentInfo?courseCode[]=COMP%20S265F&courseCode[]=COMP%20S266F'
````

---
### Restful - Get Student Detail
PATH : `/api/studentInfo/:studId`

HTTP request types : `GET`

- Request One Student Record

#### URL Parameter parameters
| Parameters  | Description |
| ----------- | ----------- |
| studId      | Student Id  |

#### CURL Sample
`Student Id` is `s0000001`
````
curl -X GET '/api/studentInfo/s0000001'
````

---
### Restful - Add Student Information
PATH : `/api/studentInfo`

HTTP request types : `POST`

- Create One Student Record

#### Request body variable
| Variable       | Description        | Format       | Required | Unique |
| -------------- | ------------------ | ------------ | -------- | ------ |
| studId         | Student Id         | s0000000     | Y        | Y      |
| studName       | Student Name       |              | Y        | N      |
| bod            | Date of Birth      | YYYY-MM-DD   | Y        | N      |
| startStudyYear | Study Year (Start) | YYYY         | Y        | N      |
| endStudyYear   | Study Year (End)   | YYYY         | Y        | N      |
| district       | District           |              | Y        | N      |
| location       | Location           |              | Y        | N      |
| courseCode     | Courses Code       | Array        | Y        | N      |

#### CURL Sample
Add new student with Student Id is `s1000000`
````
curl -X POST '/api/studentInfo' -H "Content-Type: application/json" --data '{"studId": "s1000000", "studName": "New Student", "bod": "2000-10-01", "startStudyYear": 2023, "endStudyYear": 2026, "district": "North", "location": "香港北角北角邨裡1號", "courseCode": ["COMP S312F", "COMP S350F"]}'
````

---
### Restful - Edit Student Information
PATH : `/api/studentInfo/:studId`

HTTP request types : `PUT`

- Modify One Student Record

- Only passed variable will be update

#### URL Parameter parameters
| Parameters  | Description |
| ----------- | ----------- |
| studId      | Student Id  |

#### Request body variable
| Variable       | Description        | Format       | Required | Unique |
| -------------- | ------------------ | ------------ | -------- | ------ |
| studName       | Student Name       |              | Y        | N      |
| bod            | Date of Birth      | YYYY-MM-DD   | Y        | N      |
| startStudyYear | Study Year (Start) | YYYY         | Y        | N      |
| endStudyYear   | Study Year (End)   | YYYY         | Y        | N      |
| district       | District           |              | Y        | N      |
| location       | Location           |              | Y        | N      |
| courseCode     | Courses Code       | Array        | Y        | N      |

#### CURL Sample
Edit `all variable` with Student Id is `s1000000`
- Edit `Student Name` to `Modified Student`
- Edit `Date of Birth` to `2000-12-24`
- Edit `Study Year` between `2020` and `2024`
- Edit `District` to `Kwun Tong`
- Edit `Location` to `觀塘觀塘道418號`
- Edit `Courses` to `["COMP S312F", "COMP S350F", "COMP S381F"]`
````
curl -X PUT '/api/studentInfo/s1000000' -H "Content-Type: application/json" --data '{"studName": "Modified Student", "bod": "2000-12-24", "startStudyYear": 2020, "endStudyYear": 2024, "district": "Kwun Tong", "location": "觀塘觀塘道418號", "courseCode": ["COMP S312F", "COMP S350F", "COMP S381F"]}'
````
Edit `Student Name` to `Edit s1000000 alone` with Student Id is `s1000000`
````
curl -X PUT '/api/studentInfo/s1000000' -H "Content-Type: application/json" --data '{"studName": "Edit s1000000 alone"}'
````
Edit `Date of Birth` to `1998-06-17` with Student Id is `s1000000`
````
curl -X PUT '/api/studentInfo/s1000000' -H "Content-Type: application/json" --data '{"bod": "1998-06-17"}'
````
Edit `Study Year` between `2010` and `2015` with Student Id is `s1000000`
````
curl -X PUT '/api/studentInfo/s1000000' -H "Content-Type: application/json" --data '{"startStudyYear": 2010, "endStudyYear": 2015}'
````
Edit `District` to `Yau Tsim Mong` with Student Id is `s1000000`
````
curl -X PUT '/api/studentInfo/s1000000' -H "Content-Type: application/json" --data '{"district": "Yau Tsim Mong"}'
````
Edit `Location` to `佐敦炮台街59號` with Student Id is `s1000000`
````
curl -X PUT '/api/studentInfo/s1000000' -H "Content-Type: application/json" --data '{"location": "佐敦炮台街59號"}'
````
Edit `Courses` to `["COMP S312F", "COMP S350F", "COMP S266F"]` with Student Id is `s1000000`
````
curl -X PUT '/api/studentInfo/s1000000' -H "Content-Type: application/json" --data '{"courseCode": ["COMP S312F", "COMP S350F", "COMP S266F"]}'
````

---
### Restful - Edit Student Course Score
PATH : `/api/studentInfo/:studId/course/:courseCode`

HTTP request types : `PUT`

- Modify One Course Score for specified student

#### URL Parameter parameters
| Parameters  | Description |
| ----------- | ----------- |
| studId      | Student Id  |
| courseCode  | Course Code |

#### Request body variable
| Variable    | Description | Format      | Required | Unique |
| ----------- | ----------- | ----------- | -------- | ------ |
| score       | Score       | 0 - 100     | Y        | N      |

#### CURL Sample
Delete student with Student Id is `s1000000` and Course Code is `COMP S350F`
````
curl -X PUT '/api/studentInfo/s1000000/course/COMP%20S350F' -H "Content-Type: application/json" --data '{"score": 20}'
````

---
### Restful - Delete Student Information
PATH : `/api/studentInfo/:studId`

HTTP request types : `DELETE`

- Delete One Student Record

#### URL Parameter parameters
| Parameters  | Description |
| ----------- | ----------- |
| studId      | Student Id  |

#### CURL Sample
Delete student with Student Id is `s1000000`
````
curl -X DELETE '/api/studentInfo/s1000000'
````

---
### Restful - Get Course Statistic Information
PATH : `/api/course/statistic`

HTTP request types : `GET`

- View each course statistic information

#### CURL Sample
Get `All Course`
````
curl -X GET '/api/course/statistic'
````