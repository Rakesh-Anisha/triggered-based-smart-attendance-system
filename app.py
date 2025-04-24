from flask import Flask, request, jsonify
from pymongo import MongoClient
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
import socket
import errno

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://192.168.118.*", "http://192.168.235.*"]}})

app.config['SECRET_KEY'] = 'your_secret_key_here'  # Replace with a secure key in production
app.config['DEBUG'] = True

client = MongoClient("mongodb://localhost:27017/")
db = client["kolkata"]

# Collections
schools_collection = db["schools"]
departments_collection = db["departments"]
teachers_collection = db["teachers"]
users_collection = db["users"]
blacklisted_tokens_collection = db["blacklisted_tokens"]
programs_collection = db["programs"]
sections_collection = db["sections"]
batch_years_collection = db["batch_years"]
subjects_collection = db["subjects"]
students_collection = db["students"]
attendance_collection = db["attendance"]
subject_totals_collection = db["subject_totals"]

# JWT Token Decorator
def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').split(" ")[1] if 'Authorization' in request.headers else None
        if not token:
            app.logger.error("Token missing in request")
            return jsonify({'message': 'Token is missing!'}), 403
        if blacklisted_tokens_collection.find_one({"token": token}):
            app.logger.error(f"Blacklisted token: {token}")
            return jsonify({'message': 'Token has been invalidated!'}), 403
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = users_collection.find_one({"registration_number": data['registration_number']})
            if not current_user:
                app.logger.error(f"User not found for registration_number: {data['registration_number']}")
                return jsonify({'message': 'User not found!'}), 403
        except Exception as e:
            app.logger.error(f"Token validation error: {str(e)}")
            return jsonify({'message': 'Token is invalid!'}), 403
        return f(current_user, *args, **kwargs)
    return decorated_function

# User Routes
@app.route('/signup', methods=['POST', 'OPTIONS'])
def signup():
    if request.method == 'OPTIONS':
        response = jsonify({"status": "OK"})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response, 200
    data = request.get_json()
    if not data or not data.get("registration_number") or not data.get("password"):
        return jsonify({"error": "Registration number and password are required"}), 400
    if users_collection.find_one({"registration_number": data["registration_number"]}):
        return jsonify({"error": "User already exists"}), 400
    hashed_password = generate_password_hash(data["password"])
    user = {
        "registration_number": data["registration_number"],
        "password": hashed_password,
        "role": data["role"],
        "name": data.get("name", ""),
        "email": data.get("email", ""),
        "address": data.get("address", ""),
        "dob": data.get("dob", "")
    }
    users_collection.insert_one(user)
    return jsonify({"message": "User created successfully!"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = users_collection.find_one({"registration_number": data.get("registration_number")})
    if not user or not check_password_hash(user["password"], data.get("password")):
        return jsonify({"error": "Invalid registration number or password"}), 401
    token = jwt.encode({
        'registration_number': user['registration_number'],
        'role': user['role'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    return jsonify({
        "token": token,
        "registration_number": user['registration_number'],
        "role": user['role']
    }), 200

@app.route('/user/profile', methods=['GET'])
@token_required
def get_user_profile(current_user):
    user_data = {
        "registration_number": current_user["registration_number"],
        "name": current_user.get("name", ""),
        "email": current_user.get("email", ""),
        "address": current_user.get("address", ""),
        "dob": current_user.get("dob", ""),
        "role": current_user.get("role", "")
    }
    return jsonify(user_data), 200

@app.route('/user/profile/update', methods=['POST'])
@token_required
def update_user_profile(current_user):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is empty"}), 400
    update_fields = {
        "name": data.get("name", current_user.get("name", "")),
        "email": data.get("email", current_user.get("email", "")),
        "address": data.get("address", current_user.get("address", "")),
        "dob": data.get("dob", current_user.get("dob", ""))
    }
    users_collection.update_one(
        {"registration_number": current_user["registration_number"]},
        {"$set": update_fields}
    )
    return jsonify({"message": "Profile updated successfully!"}), 200

# Attendance List Route
@app.route('/attendance/list', methods=['POST', 'OPTIONS'])
def get_attendance_list():
    if request.method == 'OPTIONS':
        response = jsonify({"status": "OK"})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return response, 200

    @token_required
    def protected_get_attendance_list(current_user):
        data = request.get_json()
        required_fields = ["department_name", "program_name", "batch_year", "section_name", "subject_code"]
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

        filter_type = data.get("filter_type", "overall")  # Default to overall
        month = data.get("month")  # Month name (e.g., "April")
        year = data.get("year")    # Year (e.g., "2025")
        date = data.get("date")    # Date (e.g., "2025-04-15")

        # Validate filter parameters
        if filter_type == "monthly" and (not month or not year):
            return jsonify({"error": "Month and year are required for monthly filter"}), 400
        if filter_type == "datewise" and not date:
            return jsonify({"error": "Date is required for datewise filter"}), 400

        # Find students based on filters
        query = {
            "department_name": data["department_name"],
            "program_name": data["program_name"],
            "batch_year": data["batch_year"],
            "section_name": data["section_name"]
        }
        
        # Ensure students are enrolled in the subject
        subject = subjects_collection.find_one({"subject_code": data["subject_code"]})
        if not subject:
            return jsonify({"error": "Subject not found"}), 404
        
        query["fingerprint_id"] = {"$in": subject.get("student_ids", [])}
        students = list(students_collection.find(query, {"_id": 0}))

        # Get all attendance records for the subject
        attendance_query = {"subject_code": data["subject_code"]}
        
        # Apply filter based on type
        if filter_type == "monthly":
            from datetime import datetime
            month_index = ["january", "february", "march", "april", "may", "june", 
                          "july", "august", "september", "october", "november", "december"].index(month.lower()) + 1
            year = int(year)
            start_date = datetime(year, month_index, 1)
            next_month = month_index % 12 + 1
            next_year = year + (month_index // 12)
            end_date = datetime(next_year, next_month, 1)
            attendance_query["timestamp"] = {"$gte": start_date, "$lt": end_date}
        elif filter_type == "datewise":
            from datetime import datetime
            selected_date = datetime.strptime(date, "%Y-%m-%d")
            next_date = selected_date.replace(hour=23, minute=59, second=59)
            attendance_query["timestamp"] = {"$gte": selected_date, "$lt": next_date}

        all_subject_records = list(attendance_collection.find(attendance_query, {"timestamp": 1, "_id": 0}))
        unique_total_dates = set(record["timestamp"].strftime("%Y-%m-%d") for record in all_subject_records)
        total_classes = len(unique_total_dates) if filter_type != "datewise" else 1

        # Calculate attendance for each student
        attendance_list = []
        for student in students:
            student_query = {
                "fingerprint_id": student["fingerprint_id"],
                "subject_code": data["subject_code"]
            }
            if filter_type == "monthly":
                student_query["timestamp"] = {"$gte": start_date, "$lt": end_date}
            elif filter_type == "datewise":
                student_query["timestamp"] = {"$gte": selected_date, "$lt": next_date}

            student_records = list(attendance_collection.find(student_query, {"_id": 0}))
            unique_present_dates = set(record["timestamp"].strftime("%Y-%m-%d") for record in student_records)
            present_classes = len(unique_present_dates) if filter_type != "datewise" else (1 if student_records else 0)
            absent_classes = total_classes - present_classes
            percentage = (present_classes / total_classes * 100) if total_classes > 0 else 0

            attendance_list.append({
                "name": student["name"],
                "roll_no": student["roll_no"],
                "reg_no": student["reg_no"],
                "section_name": student["section_name"],
                "subject_code": data["subject_code"],
                "subject_name": subject.get("subject_name", ""),
                "total_classes": total_classes,
                "present_classes": present_classes,
                "absent_classes": absent_classes,
                "percentage": round(percentage, 2)
            })

        return jsonify({"attendance_list": attendance_list}), 200

    return protected_get_attendance_list()

# School Routes
@app.route('/schools', methods=['GET'])
def get_schools():
    schools = list(schools_collection.find({}, {"_id": 0}))
    return jsonify(schools), 200

@app.route('/school', methods=['POST'])
def create_school():
    data = request.get_json()
    if not data or "school_name" not in data:
        return jsonify({"error": "School name is required"}), 400
    if schools_collection.find_one({"school_name": data["school_name"]}):
        return jsonify({"error": "School already exists"}), 400
    schools_collection.insert_one({"school_name": data["school_name"]})
    return jsonify({"message": "School created successfully!"}), 200

# Department Routes
@app.route('/departments', methods=['GET'])
def get_departments():
    school_name = request.args.get("school_name")
    query = {"school_name": school_name} if school_name else {}
    departments = list(departments_collection.find(query, {"_id": 0}))
    return jsonify(departments), 200

@app.route('/department', methods=['POST'])
def create_department():
    data = request.get_json()
    if not data or "department_name" not in data or "school_name" not in data:
        return jsonify({"error": "Department name and school name are required"}), 400
    departments_collection.insert_one({
        "department_name": data["department_name"],
        "school_name": data["school_name"]
    })
    return jsonify({"message": "Department created successfully!"}), 200

@app.route('/department/update', methods=['POST'])
def update_department():
    data = request.get_json()
    if not data or "old_department_name" not in data or "department_name" not in data or "school_name" not in data:
        return jsonify({"error": "Old department name, new department name, and school name are required"}), 400
    departments_collection.update_one(
        {"department_name": data["old_department_name"], "school_name": data["school_name"]},
        {"$set": {"department_name": data["department_name"]}}
    )
    return jsonify({"message": "Department updated successfully!"}), 200

@app.route('/department/delete', methods=['POST'])
def delete_department():
    data = request.get_json()
    if not data or "department_name" not in data or "school_name" not in data:
        return jsonify({"error": "Department name and school name are required"}), 400
    departments_collection.delete_one({"department_name": data["department_name"], "school_name": data["school_name"]})
    return jsonify({"message": "Department deleted successfully!"}), 200

# Program Routes
@app.route('/programs', methods=['GET'])
def get_programs():
    department_name = request.args.get("department_name")
    query = {"department_name": department_name} if department_name else {}
    programs = list(programs_collection.find(query, {"_id": 0}))
    return jsonify(programs), 200

@app.route('/program', methods=['POST'])
def create_program():
    data = request.get_json()
    if not data or "program_name" not in data or "department_name" not in data:
        return jsonify({"error": "Program name and department name are required"}), 400
    programs_collection.insert_one({
        "program_name": data["program_name"],
        "department_name": data["department_name"]
    })
    return jsonify({"message": "Program created successfully!"}), 200

@app.route('/program/update', methods=['POST'])
def update_program():
    data = request.get_json()
    if not data or "old_program_name" not in data or "program_name" not in data or "department_name" not in data:
        return jsonify({"error": "Old program name, new program name, and department name are required"}), 400
    programs_collection.update_one(
        {"program_name": data["old_program_name"], "department_name": data["department_name"]},
        {"$set": {"program_name": data["program_name"]}}
    )
    return jsonify({"message": "Program updated successfully!"}), 200

@app.route('/program/delete', methods=['POST'])
def delete_program():
    data = request.get_json()
    if not data or "program_name" not in data or "department_name" not in data:
        return jsonify({"error": "Program name and department name are required"}), 400
    programs_collection.delete_one({"program_name": data["program_name"], "department_name": data["department_name"]})
    return jsonify({"message": "Program deleted successfully!"}), 200

# Section Routes
@app.route('/sections', methods=['GET'])
def get_sections():
    sections = list(sections_collection.find({}, {"_id": 0}))
    return jsonify(sections), 200

@app.route('/section', methods=['POST'])
def create_section():
    data = request.get_json()
    if not data or "section_name" not in data:
        return jsonify({"error": "Section name is required"}), 400
    sections_collection.insert_one({"section_name": data["section_name"]})
    return jsonify({"message": "Section created successfully!"}), 200

@app.route('/section/update', methods=['POST'])
def update_section():
    data = request.get_json()
    if not data or "old_section_name" not in data or "section_name" not in data:
        return jsonify({"error": "Old section name and new section name are required"}), 400
    sections_collection.update_one(
        {"section_name": data["old_section_name"]},
        {"$set": {"section_name": data["section_name"]}}
    )
    return jsonify({"message": "Section updated successfully!"}), 200

@app.route('/section/delete', methods=['POST'])
def delete_section():
    data = request.get_json()
    if not data or "section_name" not in data:
        return jsonify({"error": "Section name is required"}), 400
    sections_collection.delete_one({"section_name": data["section_name"]})
    return jsonify({"message": "Section deleted successfully!"}), 200

# Batch Year Routes
@app.route('/batch_years', methods=['GET'])
def get_batch_years():
    batch_years = list(batch_years_collection.find({}, {"_id": 0}))
    return jsonify(batch_years), 200

@app.route('/batch_year', methods=['POST'])
def create_batch_year():
    data = request.get_json()
    if not data or "batch_year" not in data:
        return jsonify({"error": "Batch year is required"}), 400
    batch_years_collection.insert_one({"batch_year": data["batch_year"]})
    return jsonify({"message": "Batch year created successfully!"}), 200

@app.route('/batch_year/update', methods=['POST'])
def update_batch_year():
    data = request.get_json()
    if not data or "old_batch_year" not in data or "batch_year" not in data:
        return jsonify({"error": "Old batch year and new batch year are required"}), 400
    batch_years_collection.update_one(
        {"batch_year": data["old_batch_year"]},
        {"$set": {"batch_year": data["batch_year"]}}
    )
    return jsonify({"message": "Batch year updated successfully!"}), 200

@app.route('/batch_year/delete', methods=['POST'])
def delete_batch_year():
    data = request.get_json()
    if not data or "batch_year" not in data:
        return jsonify({"error": "Batch year is required"}), 400
    batch_years_collection.delete_one({"batch_year": data["batch_year"]})
    return jsonify({"message": "Batch year deleted successfully!"}), 200

# Subject Routes
@app.route('/subjects', methods=['GET'])
def get_subjects():
    department_name = request.args.get("department_name")
    query = {"department_name": department_name} if department_name else {}
    subjects = list(subjects_collection.find(query, {"_id": 0}))
    return jsonify(subjects), 200

@app.route('/subject', methods=['POST'])
def create_subject():
    data = request.get_json()
    if not data or "subject_code" not in data or "subject_name" not in data or "department_name" not in data:
        return jsonify({"error": "Subject code, subject name, and department name are required"}), 400
    subjects_collection.insert_one({
        "subject_code": data["subject_code"],
        "subject_name": data["subject_name"],
        "department_name": data["department_name"],
        "teacher_ids": [],
        "student_ids": []
    })
    return jsonify({"message": "Subject created successfully!"}), 200

@app.route('/subject/update', methods=['POST'])
def update_subject():
    data = request.get_json()
    if not data or "subject_code" not in data:
        return jsonify({"error": "Subject code is required"}), 400
    subjects_collection.update_one(
        {"subject_code": data["subject_code"]},
        {"$set": {
            "subject_name": data.get("subject_name"),
            "department_name": data.get("department_name")
        }}
    )
    return jsonify({"message": "Subject updated successfully!"}), 200

@app.route('/subject/delete', methods=['POST'])
def delete_subject():
    data = request.get_json()
    if not data or "subject_code" not in data:
        return jsonify({"error": "Subject code is required"}), 400
    subjects_collection.delete_one({"subject_code": data["subject_code"]})
    return jsonify({"message": "Subject deleted successfully!"}), 200

# Teacher Routes
@app.route('/teachers', methods=['GET'])
def get_teachers():
    try:
        school_name = request.args.get("school_name")
        department_name = request.args.get("department_name")
        query = {}
        if school_name:
            query["school_name"] = school_name
        if department_name:
            query["department_name"] = department_name
        teachers = list(teachers_collection.find(query, {"_id": 0}))
        return jsonify(teachers), 200
    except Exception as e:
        app.logger.error(f"Error fetching teachers: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/teacher', methods=['POST'])
def create_teacher():
    data = request.get_json()
    if not data or "employee_id" not in data or "name" not in data or "school_name" not in data or "department_name" not in data:
        return jsonify({"error": "Employee ID, name, school name, and department name are required"}), 400
    if teachers_collection.find_one({"employee_id": data["employee_id"]}):
        return jsonify({"error": "Teacher with this Employee ID already exists"}), 400
    teachers_collection.insert_one({
        "employee_id": data["employee_id"],
        "name": data["name"],
        "school_name": data["school_name"],
        "department_name": data["department_name"]
    })
    return jsonify({"message": "Teacher created successfully!"}), 200

@app.route('/teacher/update', methods=['POST'])
def update_teacher():
    data = request.get_json()
    if not data or "employee_id" not in data:
        return jsonify({"error": "Employee ID is required"}), 400
    teachers_collection.update_one(
        {"employee_id": data["employee_id"]},
        {"$set": {
            "name": data.get("name"),
            "school_name": data.get("school_name"),
            "department_name": data.get("department_name")
        }}
    )
    return jsonify({"message": "Teacher updated successfully!"}), 200

@app.route('/teacher/delete', methods=['POST'])
def delete_teacher():
    data = request.get_json()
    if not data or "employee_id" not in data:
        return jsonify({"error": "Employee ID is required"}), 400
    teachers_collection.delete_one({"employee_id": data["employee_id"]})
    return jsonify({"message": "Teacher deleted successfully!"}), 200

# Student Routes
@app.route('/students', methods=['GET'])
def get_students():
    students = list(students_collection.find({}, {"_id": 0}))
    return jsonify(students), 200

@app.route('/submit', methods=['POST'])
def submit():
    data = request.get_json()
    if not data or "fingerprint_id" not in data:
        return jsonify({"error": "Fingerprint ID is required"}), 400
    if students_collection.find_one({"fingerprint_id": data["fingerprint_id"]}):
        return jsonify({"error": "Student with this Fingerprint ID already exists"}), 400
    required_fields = ["reg_no", "roll_no", "name", "school_name", "department_name", "program_name", "section_name", "batch_year"]
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400
    students_collection.insert_one(data)
    return jsonify({"message": "Student created successfully!"}), 200

@app.route('/update', methods=['POST'])
def update_student():
    data = request.get_json()
    if not data or "fingerprint_id" not in data:
        return jsonify({"error": "Fingerprint ID is required"}), 400
    students_collection.update_one(
        {"fingerprint_id": data["fingerprint_id"]},
        {"$set": {
            "reg_no": data.get("reg_no"),
            "roll_no": data.get("roll_no"),
            "name": data.get("name"),
            "school_name": data.get("school_name"),
            "department_name": data.get("department_name"),
            "program_name": data.get("program_name"),
            "section_name": data.get("section_name"),
            "batch_year": data.get("batch_year")
        }}
    )
    return jsonify({"message": "Student updated successfully!"}), 200

@app.route('/delete', methods=['POST'])
def delete_student():
    data = request.get_json()
    if not data or "fingerprint_id" not in data:
        return jsonify({"error": "Fingerprint ID is required"}), 400
    students_collection.delete_one({"fingerprint_id": data["fingerprint_id"]})
    return jsonify({"message": "Student deleted successfully!"}), 200

@app.route('/students/filter', methods=['POST', 'OPTIONS'])
def filter_students():
    if request.method == 'OPTIONS':
        response = jsonify({"status": "OK"})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response, 200
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is empty"}), 400
    
    query = {
        "school_name": data.get("school_name"),
        "department_name": data.get("department_name"),
        "program_name": data.get("program_name"),
        "section_name": data.get("section_name"),
        "batch_year": data.get("batch_year")
    }
    
    if "subject_code" in data and data["subject_code"]:
        subject = subjects_collection.find_one({"subject_code": data["subject_code"]}, {"_id": 0})
        if subject and "student_ids" in subject:
            query["fingerprint_id"] = {"$in": subject["student_ids"]}
    
    students = list(students_collection.find({k: v for k, v in query.items() if v}, {"_id": 0}))
    return jsonify({"students": students}), 200

# Attendance Routes
@app.route('/attendance', methods=['POST'])
def mark_attendance():
    data = request.get_json()
    if not data or "fingerprint_id" not in data or "subject_code" not in data:
        return jsonify({"error": "Fingerprint ID and subject code are required"}), 400
    
    student = students_collection.find_one({"fingerprint_id": data["fingerprint_id"]})
    if not student:
        return jsonify({"error": "Student not found"}), 404
    
    attendance_data = {
        "fingerprint_id": data["fingerprint_id"],
        "subject_code": data["subject_code"],
        "timestamp": datetime.datetime.utcnow(),
        "student_name": student["name"],
        "roll_no": student["roll_no"]
    }
    attendance_collection.insert_one(attendance_data)
    return jsonify({"message": "Attendance marked successfully!"}), 200

@app.route('/attendance/filter', methods=['POST', 'OPTIONS'])
def filter_attendance():
    if request.method == 'OPTIONS':
        response = jsonify({"status": "OK"})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return response, 200
    
    @token_required
    def handle_post(current_user):
        data = request.get_json()
        if not data or "reg_no" not in data:
            return jsonify({"error": "Registration number is required"}), 400
        
        # Fetch student by reg_no
        student = students_collection.find_one({"reg_no": data["reg_no"]})
        if not student:
            return jsonify({"error": "Student not found with this registration number"}), 404
        
        # Fetch student's attendance records
        query = {"fingerprint_id": student["fingerprint_id"]}
        attendance_records = list(attendance_collection.find(query, {"_id": 0}))
        
        # Get subjects the student is tagged to
        enrolled_subjects = list(subjects_collection.find({"student_ids": student["fingerprint_id"]}, {"_id": 0}))
        enrolled_subject_codes = {subject["subject_code"] for subject in enrolled_subjects}
        
        # Calculate attendance only for enrolled subjects
        result = {}
        for subject in enrolled_subjects:
            subject_code = subject["subject_code"]
            
            # Count present classes for this student (one per day)
            student_subject_records = [r for r in attendance_records if r["subject_code"] == subject_code]
            unique_present_dates = set(record["timestamp"].strftime("%Y-%m-%d") for record in student_subject_records)
            present_classes = len(unique_present_dates)
            
            # Calculate total classes for this subject across all students (one per day)
            all_subject_records = list(attendance_collection.find({"subject_code": subject_code}, {"timestamp": 1, "_id": 0}))
            unique_total_dates = set(record["timestamp"].strftime("%Y-%m-%d") for record in all_subject_records)
            total_classes = len(unique_total_dates)
            
            # Calculate percentage
            percentage = (present_classes / total_classes * 100) if total_classes > 0 else 0
            
            result[subject_code] = {
                "subject_name": subject["subject_name"],
                "present_classes": present_classes,
                "total_classes": total_classes,
                "percentage": round(percentage, 2)
            }
        
        return jsonify({
            "attendance_summary": result,
            "raw_records": attendance_records
        }), 200
    
    return handle_post()

# Route to Set Total Classes
@app.route('/subject/total-classes', methods=['POST'])
@token_required
def set_subject_total_classes(current_user):
    data = request.get_json()
    if not data or "subject_code" not in data or "total_classes" not in data:
        return jsonify({"error": "Subject code and total classes are required"}), 400
    
    subject = subjects_collection.find_one({"subject_code": data["subject_code"]})
    if not subject:
        return jsonify({"error": "Subject not found"}), 404
    
    subject_totals_collection.update_one(
        {"subject_code": data["subject_code"]},
        {"$set": {"total_classes": data["total_classes"]}},
        upsert=True
    )
    return jsonify({"message": "Total classes set successfully"}), 200

# Options Route for ESP32
@app.route('/options', methods=['GET'])
def get_options():
    app.logger.info("Fetching options for ESP32")
    options = {
        "schools": [school["school_name"] for school in schools_collection.find({}, {"_id": 0})],
        "departments": [dept["department_name"] for dept in departments_collection.find({}, {"_id": 0})],
        "programs": [prog["program_name"] for prog in programs_collection.find({}, {"_id": 0})],
        "sections": [sec["section_name"] for sec in sections_collection.find({}, {"_id": 0})],
        "batch_years": [by["batch_year"] for by in batch_years_collection.find({}, {"_id": 0})]
    }
    return jsonify(options), 200

# Tagging Routes
@app.route('/teacher/tag-subjects', methods=['POST', 'OPTIONS'])
def tag_subjects_to_teacher():
    if request.method == 'OPTIONS':
        response = jsonify({"status": "OK"})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response, 200

    data = request.get_json()
    if not data or "teacher_id" not in data or "subjects" not in data:
        return jsonify({"error": "Teacher ID and subjects are required"}), 400

    teacher_id = data["teacher_id"]
    subjects = data["subjects"]

    teacher = teachers_collection.find_one({"employee_id": teacher_id})
    if not teacher:
        return jsonify({"error": f"Teacher with ID {teacher_id} not found"}), 404

    for subject_code in subjects:
        subject = subjects_collection.find_one({"subject_code": subject_code})
        if subject:
            subjects_collection.update_one(
                {"subject_code": subject_code},
                {"$addToSet": {"teacher_ids": teacher_id}},
                upsert=True
            )
        else:
            return jsonify({"error": f"Subject {subject_code} not found"}), 404

    return jsonify({"message": "Subjects tagged to teacher successfully!"}), 200

@app.route('/tag-subjects-with-students', methods=['POST', 'OPTIONS'])
def tag_subjects_to_students():
    if request.method == 'OPTIONS':
        response = jsonify({"status": "OK"})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response, 200

    data = request.get_json()
    if not data or "students" not in data or "subjects" not in data:
        return jsonify({"error": "Students and subjects are required"}), 400

    students = data["students"]
    subjects = data["subjects"]

    for student_id in students:
        student = students_collection.find_one({"fingerprint_id": student_id})
        if not student:
            return jsonify({"error": f"Student with ID {student_id} not found"}), 404

    for subject_code in subjects:
        subject = subjects_collection.find_one({"subject_code": subject_code})
        if subject:
            subjects_collection.update_one(
                {"subject_code": subject_code},
                {"$addToSet": {"student_ids": {"$each": students}}},
                upsert=True
            )
        else:
            return jsonify({"error": f"Subject {subject_code} not found"}), 404

    return jsonify({"message": "Subjects tagged to students successfully!"}), 200

# Student Profile Route
@app.route('/student/profile', methods=['GET'])
@token_required
def get_student_profile(current_user):
    reg_no = request.args.get("reg_no")
    if not reg_no:
        return jsonify({"error": "Registration number is required"}), 400
    
    student = students_collection.find_one({"reg_no": reg_no}, {"_id": 0})
    if not student:
        return jsonify({"error": "Student not found with this registration number"}), 404
    
    attendance_records = list(attendance_collection.find(
        {"fingerprint_id": student["fingerprint_id"]}, 
        {"_id": 0}
    ))
    
    response = {
        "student": student,
        "attendance": attendance_records
    }
    return jsonify(response), 200

# Total Routes
@app.route('/totals/students', methods=['GET'])
@token_required
def get_total_students(current_user):
    total = students_collection.count_documents({})
    return jsonify({"total_students": total}), 200

@app.route('/totals/teachers', methods=['GET'])
@token_required
def get_total_teachers(current_user):
    total = teachers_collection.count_documents({})
    return jsonify({"total_teachers": total}), 200

@app.route('/totals/schools', methods=['GET'])
@token_required
def get_total_schools(current_user):
    total = schools_collection.count_documents({})
    return jsonify({"total_schools": total}), 200

@app.route('/totals/departments', methods=['GET'])
@token_required
def get_total_departments(current_user):
    total = departments_collection.count_documents({})
    return jsonify({"total_departments": total}), 200

@app.route('/totals/programs', methods=['GET'])
@token_required
def get_total_programs(current_user):
    total = programs_collection.count_documents({})
    return jsonify({"total_programs": total}), 200

@app.route('/totals/sections', methods=['GET'])
@token_required
def get_total_sections(current_user):
    total = sections_collection.count_documents({})
    return jsonify({"total_sections": total}), 200

@app.route('/totals/subjects', methods=['GET'])
@token_required
def get_total_subjects(current_user):
    total = subjects_collection.count_documents({})
    return jsonify({"total_subjects": total}), 200

def check_port(port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(('0.0.0.0', port))
        return True
    except socket.error as e:
        if e.errno == errno.EADDRINUSE:
            app.logger.error(f"Port {port} is already in use")
            return False
        raise
    finally:
        sock.close()

if __name__ == '__main__':
    port = 5000
    if not check_port(port):
        app.logger.error(f"Failed to start on port {port}. Trying port 5001...")
        port = 5001
    app.run(host='0.0.0.0', port=port, debug=True)