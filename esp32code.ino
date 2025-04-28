#include <WiFi.h>
#include <WebServer.h>
#include <HardwareSerial.h>
#include <Adafruit_Fingerprint.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <EEPROM.h>

#define RX_PIN 16  // UART RX for R307
#define TX_PIN 17  // UART TX for R307
#define EEPROM_SIZE 4  // Store a 4-byte integer for last used ID

HardwareSerial mySerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);
WebServer server(80);

const char* ssid = "vivo 1915";      // Replace with your WiFi SSID
const char* password = "111222333";  // Replace with your WiFi password
int enrolledCount = 0;              // Actual number of enrolled fingerprints
int availableSlots = 1000;          // Total slots, updated dynamically
int lastUsedId = 0;                 // Highest ID ever used
const char* mongoServer = "http://192.168.235.167:5000"; // Flask server on 5000
String currentFingerprintId = "";
String currentSubjectCode = "";

void connectToWiFi() {
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi ('" + String(ssid) + "')");
    int attempts = 0;
    const int maxAttempts = 20;
    while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts) {
        delay(1000);
        Serial.print(".");
        attempts++;
    }
    Serial.println();
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("WiFi connected successfully!");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("Failed to connect to WiFi after " + String(maxAttempts) + " attempts.");
    }
}

void loadLastUsedId() {
    EEPROM.begin(EEPROM_SIZE);
    lastUsedId = EEPROM.read(0) | (EEPROM.read(1) << 8) | (EEPROM.read(2) << 16) | (EEPROM.read(3) << 24);
    enrolledCount = 0;
    for (int id = 1; id <= lastUsedId; id++) {
        if (finger.loadModel(id) == FINGERPRINT_OK) {
            enrolledCount++;
        }
    }
    availableSlots = 1000 - enrolledCount;
    Serial.print("Loaded last used ID: ");
    Serial.println(lastUsedId);
    Serial.print("Enrolled Count: ");
    Serial.println(enrolledCount);
    Serial.print("Available Slots: ");
    Serial.println(availableSlots);
    EEPROM.end();
}

void saveLastUsedId(int id) {
    if (id > lastUsedId) {
        EEPROM.begin(EEPROM_SIZE);
        EEPROM.write(0, id & 0xFF);
        EEPROM.write(1, (id >> 8) & 0xFF);
        EEPROM.write(2, (id >> 16) & 0xFF);
        EEPROM.write(3, (id >> 24) & 0xFF);
        EEPROM.commit();
        EEPROM.end();
        lastUsedId = id;
    }
    enrolledCount = 0;
    for (int id = 1; id <= lastUsedId; id++) {
        if (finger.loadModel(id) == FINGERPRINT_OK) {
            enrolledCount++;
        }
    }
    availableSlots = 1000 - enrolledCount;
    Serial.print("Saved last used ID: ");
    Serial.println(lastUsedId);
    Serial.print("Enrolled Count: ");
    Serial.println(enrolledCount);
    Serial.print("Available Slots: ");
    Serial.println(availableSlots);
}

int getNextAvailableId() {
    for (int id = 1; id <= 1000; id++) {
        if (finger.loadModel(id) != FINGERPRINT_OK) {
            return id;
        }
    }
    return -1;
}

String fetchOptions() {
    String optionsJson = "{}";
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(String(mongoServer) + "/options");
        int httpCode = http.GET();
        if (httpCode == 200) {
            optionsJson = http.getString();
        }
        http.end();
    }
    return optionsJson;
}

void handleRoot() {
    int nextId = getNextAvailableId();
    String optionsJson = fetchOptions();
    
    String html = "<html><head><style>"
                  "body { font-family: Arial, sans-serif; padding: 20px; background-color: #f0f2f5; margin: 0; }"
                  "h1 { color: #007BFF; text-align: center; margin-bottom: 20px; }"
                  "h2 { color: #333; margin-top: 20px; }"
                  "p { font-size: 16px; margin: 5px 0; }"
                  ".container { max-width: 900px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }"
                  ".section { margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #fafafa; }"
                  ".status { color: #333; font-weight: bold; padding: 10px; background-color: #fff; border-radius: 5px; text-align: center; margin-bottom: 15px; }"
                  "button { background-color: #007BFF; color: #fff; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; margin: 5px; transition: background-color 0.3s; }"
                  "button:hover { background-color: #0056b3; }"
                  ".form-group { margin-bottom: 15px; display: flex; flex-wrap: wrap; align-items: center; }"
                  "label { font-weight: bold; margin-right: 10px; width: 120px; color: #555; }"
                  "input[type='text'], select { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; min-width: 200px; }"
                  "input[readonly] { background: #e9ecef; }"
                  ".button-group { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }"
                  "#studentList table { width: 100%; border-collapse: collapse; }"
                  "#studentList th, #studentList td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }"
                  "#studentList th { background: #007BFF; color: #fff; }"
                  "#studentList tr:hover { background: #f5f5f5; }"
                  "@media (max-width: 600px) { .form-group { flex-direction: column; align-items: flex-start; } label { width: auto; margin-bottom: 5px; } input[type='text'], select { width: 100%; } }"
                  "</style></head><body>"
                  "<div class='container'>"
                  "<h1>Fingerprint Enrollment System</h1>"
                  "<div class='section'>"
                  "<p>Enrolled Fingerprints: " + String(enrolledCount) + "</p>"
                  "<p>Available Slots: " + String(availableSlots) + "</p>"
                  "<p>Next Available ID: " + String(nextId) + "</p>"
                  "<div class='status' id='status'>Press a button to begin</div>"
                  "</div>"
                  "<div class='section'>"
                  "<h2>Actions</h2>"
                  "<div class='button-group'>"
                  "<button onclick='location.reload()'>Home</button>"
                  "<button onclick='startEnrollment()'>Start Enrollment</button>"
                  "<button onclick='verifyFinger()'>Verify Finger</button>"
                  "<button onclick='fetchStudents()'>View Students</button>"
                  "</div>"
                  "</div>"
                  "<div class='section' id='studentForm' style='display:none;'>"
                  "<h2>Enroll Student</h2>"
                  "<div class='form-group'><label>Fingerprint ID:</label><input type='text' id='fingerprint_id' readonly></div>"
                  "<div class='form-group'><label>Registration No:</label><input type='text' id='reg_no'></div>"
                  "<div class='form-group'><label>Roll No:</label><input type='text' id='roll_no'></div>"
                  "<div class='form-group'><label>Name:</label><input type='text' id='name'></div>"
                  "<div class='form-group'><label>School:</label><select id='school_name' onchange='updateDepartments()'></select></div>"
                  "<div class='form-group'><label>Department:</label><select id='department_name' onchange='updatePrograms()'></select></div>"
                  "<div class='form-group'><label>Program:</label><select id='program_name'></select></div>"
                  "<div class='form-group'><label>Section:</label><select id='section_name'></select></div>"
                  "<div class='form-group'><label>Batch Year:</label><select id='batch_year'></select></div>"
                  "<div class='button-group'><button type='button' onclick='submitForm()'>Submit</button></div>"
                  "</div>"
                  "<div class='section' id='studentList'></div>"
                  "<div class='section' id='editForm' style='display:none;'>"
                  "<h2>Edit Student</h2>"
                  "<div class='form-group'><label>Fingerprint ID:</label><input type='text' id='edit_fingerprint_id' readonly></div>"
                  "<div class='form-group'><label>Registration No:</label><input type='text' id='edit_reg_no'></div>"
                  "<div class='form-group'><label>Roll No:</label><input type='text' id='edit_roll_no'></div>"
                  "<div class='form-group'><label>Name:</label><input type='text' id='edit_name'></div>"
                  "<div class='form-group'><label>School:</label><select id='edit_school_name' onchange='updateEditDepartments()'></select></div>"
                  "<div class='form-group'><label>Department:</label><select id='edit_department_name' onchange='updateEditPrograms()'></select></div>"
                  "<div class='form-group'><label>Program:</label><select id='edit_program_name'></select></div>"
                  "<div class='form-group'><label>Section:</label><select id='edit_section_name'></select></div>"
                  "<div class='form-group'><label>Batch Year:</label><select id='edit_batch_year'></select></div>"
                  "<div class='button-group'><button type='button' onclick='updateStudent()'>Update</button></div>"
                  "</div>"
                  "</div>"
                  "<script>"
                  "let fingerprintId = '';"
                  "let enrollmentInProgress = false;"
                  "const options = " + optionsJson + ";"
                  "function updateStatus(message) { document.getElementById('status').innerText = message; }"
                  "function populateDropdown(id, items, selectedValue = '') {"
                  "  const select = document.getElementById(id);"
                  "  select.innerHTML = '<option value=\"\">Select ' + id.replace('edit_', '').replace('_name', '') + '</option>';"
                  "  items.forEach(item => {"
                  "    const option = document.createElement('option');"
                  "    option.value = item;"
                  "    option.text = item;"
                  "    if (item === selectedValue) option.selected = true;"
                  "    select.appendChild(option);"
                  "  });"
                  "}"
                  "async function fetchDropdownOptions(endpoint, paramName, paramValue) {"
                  "  try {"
                  "    const url = '" + String(mongoServer) + "' + endpoint + (paramValue ? '?' + paramName + '=' + encodeURIComponent(paramValue) : '');"
                  "    console.log('Fetching:', url);"
                  "    const response = await fetch(url);"
                  "    if (!response.ok) {"
                  "      console.error('HTTP error:', response.status, response.statusText);"
                  "      return [];"
                  "    }"
                  "    const data = await response.json();"
                  "    console.log('Received data:', data);"
                  "    let key;"
                  "    if (endpoint === '/departments') {"
                  "      key = 'department_name';"
                  "    } else if (endpoint === '/programs') {"
                  "      key = 'program_name';"
                  "    } else {"
                  "      key = endpoint.slice(1, -1) + '_name';"
                  "    }"
                  "    const values = data.map(item => item[key]).filter(val => val);"
                  "    console.log('Mapped values:', values);"
                  "    return values;"
                  "  } catch (error) {"
                  "    console.error('Error fetching ' + endpoint + ':', error);"
                  "    updateStatus('Error fetching ' + endpoint + ': ' + error.message);"
                  "    return [];"
                  "  }"
                  "}"
                  "function populateInitialDropdowns() {"
                  "  populateDropdown('school_name', options.schools);"
                  "  populateDropdown('section_name', options.sections);"
                  "  populateDropdown('batch_year', options.batch_years);"
                  "  populateDropdown('edit_school_name', options.schools);"
                  "  populateDropdown('edit_section_name', options.sections);"
                  "  populateDropdown('edit_batch_year', options.batch_years);"
                  "  populateDropdown('department_name', []);"
                  "  populateDropdown('program_name', []);"
                  "  populateDropdown('edit_department_name', []);"
                  "  populateDropdown('edit_program_name', []);"
                  "}"
                  "async function updateDepartments() {"
                  "  const school = document.getElementById('school_name').value;"
                  "  console.log('Selected school:', school);"
                  "  const departments = await fetchDropdownOptions('/departments', 'school_name', school);"
                  "  populateDropdown('department_name', departments);"
                  "  populateDropdown('program_name', []);"
                  "}"
                  "async function updatePrograms() {"
                  "  const department = document.getElementById('department_name').value;"
                  "  console.log('Selected department:', department);"
                  "  if (department) {"
                  "    const programs = await fetchDropdownOptions('/programs', 'department_name', department);"
                  "    populateDropdown('program_name', programs);"
                  "  } else {"
                  "    populateDropdown('program_name', []);"
                  "  }"
                  "}"
                  "async function updateEditDepartments() {"
                  "  const school = document.getElementById('edit_school_name').value;"
                  "  console.log('Selected edit school:', school);"
                  "  const departments = await fetchDropdownOptions('/departments', 'school_name', school);"
                  "  populateDropdown('edit_department_name', departments);"
                  "  populateDropdown('edit_program_name', []);"
                  "}"
                  "async function updateEditPrograms() {"
                  "  const department = document.getElementById('edit_department_name').value;"
                  "  console.log('Selected edit department:', department);"
                  "  if (department) {"
                  "    const programs = await fetchDropdownOptions('/programs', 'department_name', department);"
                  "    populateDropdown('edit_program_name', programs);"
                  "  } else {"
                  "    populateDropdown('edit_program_name', []);"
                  "  }"
                  "}"
                  "document.addEventListener('DOMContentLoaded', populateInitialDropdowns);"
                  "async function startEnrollment() {"
                  "  if (enrollmentInProgress) return;"
                  "  enrollmentInProgress = true;"
                  "  try {"
                  "    updateStatus('Place your finger on the scanner...');"
                  "    await new Promise(resolve => setTimeout(resolve, 1000));"
                  "    const response = await fetch('/enroll', { method: 'POST' });"
                  "    const data = await response.json();"
                  "    if (data.status === 'step2') {"
                  "      updateStatus('Remove finger and place it again...');"
                  "      await new Promise(resolve => setTimeout(resolve, 1000));"
                  "    } else if (data.status === 'failed') {"
                  "      updateStatus('Enrollment failed: ' + data.message);"
                  "      enrollmentInProgress = false;"
                  "      return;"
                  "    }"
                  "    const response2 = await fetch('/enroll', { method: 'POST' });"
                  "    const data2 = await response2.json();"
                  "    if (data2.status === 'step3') {"
                  "      updateStatus('Place the same finger again...');"
                  "      await new Promise(resolve => setTimeout(resolve, 1000));"
                  "    } else if (data2.status === 'failed') {"
                  "      updateStatus('Enrollment failed: ' + data2.message);"
                  "      enrollmentInProgress = false;"
                  "      return;"
                  "    }"
                  "    const response3 = await fetch('/enroll', { method: 'POST' });"
                  "    const data3 = await response3.json();"
                  "    if (data3.status === 'success') {"
                  "      updateStatus('Fingerprint captured! Please fill the form and submit.');"
                  "      fingerprintId = data3.fingerprint_id;"
                  "      document.getElementById('fingerprint_id').value = fingerprintId;"
                  "      document.getElementById('studentForm').style.display = 'block';"
                  "    } else {"
                  "      updateStatus('Enrollment failed: ' + data3.message);"
                  "    }"
                  "  } catch (error) {"
                  "    updateStatus('Error: ' + error.message);"
                  "  } finally {"
                  "    enrollmentInProgress = false;"
                  "  }"
                  "}"
                  "async function verifyFinger() {"
                  "  if (enrollmentInProgress) return;"
                  "  enrollmentInProgress = true;"
                  "  try {"
                  "    updateStatus('Place your finger to verify...');"
                  "    const response = await fetch('/verify-local', { method: 'POST' });"
                  "    const data = await response.json();"
                  "    if (data.status === 'success') {"
                  "      updateStatus('Fingerprint verified - ID: ' + data.fingerprint_id);"
                  "      const studentResponse = await fetch('/students');"
                  "      const students = await studentResponse.json();"
                  "      const student = students.find(s => s.fingerprint_id === data.fingerprint_id);"
                  "      if (student) {"
                  "        updateStatus('Verified - ID: ' + data.fingerprint_id + ', Name: ' + student.name + ', Roll No: ' + student.roll_no + ', Reg No: ' + student.reg_no);"
                  "      } else {"
                  "        updateStatus('Verified - ID: ' + data.fingerprint_id + ' (Student details not found)');"
                  "      }"
                  "    } else {"
                  "      updateStatus('Verification failed: ' + data.message);"
                  "    }"
                  "  } catch (error) {"
                  "    updateStatus('Error: ' + error.message);"
                  "  } finally {"
                  "    enrollmentInProgress = false;"
                  "  }"
                  "}"
                  "async function fetchStudents() {"
                  "  try {"
                  "    const response = await fetch('/students');"
                  "    const data = await response.json();"
                  "    data.sort((a, b) => parseInt(a.fingerprint_id) - parseInt(b.fingerprint_id));"
                  "    let list = '<h2>Student List</h2><table>' +"
                  "      '<tr><th>ID</th><th>Reg No</th><th>Roll No</th><th>Name</th><th>School</th><th>Department</th><th>Program</th><th>Section</th><th>Batch Year</th><th>Action</th></tr>';"
                  "    data.forEach(student => {"
                  "      list += '<tr>' +"
                  "        '<td>' + student.fingerprint_id + '</td>' +"
                  "        '<td>' + student.reg_no + '</td>' +"
                  "        '<td>' + student.roll_no + '</td>' +"
                  "        '<td>' + student.name + '</td>' +"
                  "        '<td>' + student.school_name + '</td>' +"
                  "        '<td>' + student.department_name + '</td>' +"
                  "        '<td>' + student.program_name + '</td>' +"
                  "        '<td>' + student.section_name + '</td>' +"
                  "        '<td>' + student.batch_year + '</td>' +"
                  "        '<td>' +"
                  "          '<button onclick=\"editStudent(\\'' + student.fingerprint_id + '\\', \\'' + student.reg_no + '\\', \\'' + student.roll_no + '\\', \\'' + student.name + '\\', \\'' + student.school_name + '\\', \\'' + student.department_name + '\\', \\'' + student.program_name + '\\', \\'' + student.section_name + '\\', \\'' + student.batch_year + '\\')\">Edit</button>' +"
                  "          '<button onclick=\"deleteStudent(\\'' + student.fingerprint_id + '\\')\">Delete</button>' +"
                  "        '</td>' +"
                  "      '</tr>';"
                  "    });"
                  "    list += '</table>';"
                  "    document.getElementById('studentList').innerHTML = list;"
                  "  } catch (error) {"
                  "    updateStatus('Error fetching students: ' + error.message);"
                  "  }"
                  "}"
                  "async function editStudent(id, reg_no, roll_no, name, school_name, department_name, program_name, section_name, batch_year) {"
                  "  document.getElementById('edit_fingerprint_id').value = id;"
                  "  document.getElementById('edit_reg_no').value = reg_no;"
                  "  document.getElementById('edit_roll_no').value = roll_no;"
                  "  document.getElementById('edit_name').value = name;"
                  "  populateDropdown('edit_school_name', options.schools, school_name);"
                  "  const departments = await fetchDropdownOptions('/departments', 'school_name', school_name);"
                  "  populateDropdown('edit_department_name', departments, department_name);"
                  "  const programs = await fetchDropdownOptions('/programs', 'department_name', department_name);"
                  "  populateDropdown('edit_program_name', programs, program_name);"
                  "  populateDropdown('edit_section_name', options.sections, section_name);"
                  "  populateDropdown('edit_batch_year', options.batch_years, batch_year);"
                  "  document.getElementById('editForm').style.display = 'block';"
                  "}"
                  "function updateStudent() {"
                  "  const formData = {"
                  "    fingerprint_id: document.getElementById('edit_fingerprint_id').value,"
                  "    reg_no: document.getElementById('edit_reg_no').value,"  
                  "    roll_no: document.getElementById('edit_roll_no').value,"  
                  "    name: document.getElementById('edit_name').value,"  
                  "    school_name: document.getElementById('edit_school_name').value,"  
                  "    department_name: document.getElementById('edit_department_name').value,"  
                  "    program_name: document.getElementById('edit_program_name').value,"  
                  "    section_name: document.getElementById('edit_section_name').value,"
                  "    batch_year: document.getElementById('edit_batch_year').value"
                  "  };"
                  "  fetch('/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })"
                  "    .then(response => response.text())"
                  "    .then(data => {"
                  "      alert(data);"
                  "      document.getElementById('editForm').style.display = 'none';"
                  "      fetchStudents();"
                  "    });"
                  "}"
                  "function submitForm() {"
                  "  const formData = {"
                  "    fingerprint_id: fingerprintId,"
                  "    reg_no: document.getElementById('reg_no').value,"  
                  "    roll_no: document.getElementById('roll_no').value,"  
                  "    name: document.getElementById('name').value,"  
                  "    school_name: document.getElementById('school_name').value,"  
                  "    department_name: document.getElementById('department_name').value,"  
                  "    program_name: document.getElementById('program_name').value,"  
                  "    section_name: document.getElementById('section_name').value,"
                  "    batch_year: document.getElementById('batch_year').value"
                  "  };"
                  "  fetch('/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })"
                  "    .then(response => response.text())"
                  "    .then(data => {"
                  "      alert(data);"
                  "      if (data.includes('successfully')) location.reload();"
                  "    });"
                  "}"
                  "function deleteStudent(id) {"
                  "  if (confirm('Are you sure you want to delete ID ' + id + '?')) {"
                  "    fetch('/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fingerprint_id: id }) })"
                  "      .then(response => response.text())"
                  "      .then(data => {"
                  "        alert(data);"
                  "        fetchStudents();"
                  "      });"
                  "  }"
                  "}"
                  "</script>"
                  "</body></html>";
    server.sendHeader("Cache-Control", "no-cache");
    server.send(200, "text/html", html);
}

void handleEnrollment() {
    static int step = 0;
    static int currentId = 0;
    DynamicJsonDocument doc(256);
    String response;

    if (step == 0) {
        currentId = getNextAvailableId();
        if (currentId == -1) {
            doc["status"] = "failed";
            doc["message"] = "No available slots.";
            serializeJson(doc, response);
            server.send(200, "application/json", response);
            return;
        }
        currentFingerprintId = String(currentId);
        int p = -1;
        unsigned long startTime = millis();
        while (p != FINGERPRINT_OK && millis() - startTime < 10000) {
            p = finger.getImage();
            if (p == FINGERPRINT_NOFINGER) delay(100);
        }
        if (p != FINGERPRINT_OK) {
            doc["status"] = "failed";
            doc["message"] = "Step 1: Image capture failed or timeout.";
            serializeJson(doc, response);
            server.send(200, "application/json", response);
            return;
        }
        p = finger.image2Tz(1);
        if (p != FINGERPRINT_OK) {
            doc["status"] = "failed";
            doc["message"] = "Step 1: Image conversion failed.";
            serializeJson(doc, response);
            server.send(200, "application/json", response);
            return;
        }
        doc["status"] = "step2";
        doc["message"] = "Remove finger and place it again...";
        doc["fingerprint_id"] = currentFingerprintId;
        step = 1;
    } else if (step == 1) {
        int p = -1;
        unsigned long startTime = millis();
        while (p != FINGERPRINT_NOFINGER && millis() - startTime < 5000) {
            p = finger.getImage();
        }
        if (millis() - startTime >= 5000) {
            doc["status"] = "failed";
            doc["message"] = "Step 2: Timeout waiting for finger removal.";
            step = 0;
            serializeJson(doc, response);
            server.send(200, "application/json", response);
            return;
        }
        doc["status"] = "step3";
        doc["message"] = "Place the same finger again...";
        doc["fingerprint_id"] = currentFingerprintId;
        step = 2;
    } else if (step == 2) {
        int p = -1;
        unsigned long startTime = millis();
        while (p != FINGERPRINT_OK && millis() - startTime < 10000) {
            p = finger.getImage();
            if (p == FINGERPRINT_NOFINGER) delay(100);
        }
        if (p != FINGERPRINT_OK) {
            doc["status"] = "failed";
            doc["message"] = "Step 3: Image capture failed or timeout.";
            step = 0;
            serializeJson(doc, response);
            server.send(200, "application/json", response);
            return;
        }
        p = finger.image2Tz(2);
        if (p != FINGERPRINT_OK) {
            doc["status"] = "failed";
            doc["message"] = "Step 3: Image conversion failed.";
            step = 0;
            serializeJson(doc, response);
            server.send(200, "application/json", response);
            return;
        }
        p = finger.createModel();
        if (p != FINGERPRINT_OK) {
            doc["status"] = "failed";
            doc["message"] = "Step 3: Model creation failed.";
            step = 0;
            serializeJson(doc, response);
            server.send(200, "application/json", response);
            return;
        }
        doc["status"] = "success";
        doc["message"] = "Fingerprint captured successfully.";
        doc["fingerprint_id"] = currentFingerprintId;
        step = 0;
    }
    serializeJson(doc, response);
    server.send(200, "application/json", response);
}

void handleVerify() {
    Serial.println("Received /verify request - Method: " + String(server.method()));
    DynamicJsonDocument doc(512);
    String response;

    if (server.method() == HTTP_OPTIONS) {
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.sendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
        server.send(200, "text/plain", "OK");
        return;
    }

    String subjectCode = server.arg("subject_code");
    if (subjectCode == "") {
        doc["status"] = "failed";
        doc["message"] = "Subject code is required.";
        serializeJson(doc, response);
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.send(200, "application/json", response);
        return;
    }
    currentSubjectCode = subjectCode;

    int p = -1;
    unsigned long startTime = millis();
    Serial.println("Waiting for finger...");
    while (p != FINGERPRINT_OK && millis() - startTime < 10000) {
        p = finger.getImage();
        if (p == FINGERPRINT_NOFINGER) delay(100);
    }
    if (p != FINGERPRINT_OK) {
        doc["status"] = "failed";
        doc["message"] = "No finger detected within 10 seconds.";
        serializeJson(doc, response);
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.send(200, "application/json", response);
        return;
    }

    p = finger.image2Tz();
    if (p != FINGERPRINT_OK) {
        doc["status"] = "failed";
        doc["message"] = "Image conversion error: " + String(p);
        serializeJson(doc, response);
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.send(200, "application/json", response);
        return;
    }

    p = finger.fingerSearch();
    if (p == FINGERPRINT_OK) {
        String matchedId = String(finger.fingerID);
        Serial.println("Fingerprint matched - ID: " + matchedId);
        if (WiFi.status() == WL_CONNECTED) {
            HTTPClient http;
            http.begin(String(mongoServer) + "/attendance");
            http.addHeader("Content-Type", "application/json");
            String jsonData = "{\"fingerprint_id\":\"" + matchedId + "\",\"subject_code\":\"" + subjectCode + "\"}";
            Serial.print("Sending JSON to Flask: ");
            Serial.println(jsonData);
            int httpCode = http.POST(jsonData);
            String flaskResponse = http.getString();
            Serial.print("HTTP Code from Flask: ");
            Serial.println(httpCode);
            Serial.print("Flask Response: ");
            Serial.println(flaskResponse);

            if (httpCode == 200) {
                DynamicJsonDocument flaskDoc(512);
                deserializeJson(flaskDoc, flaskResponse);
                if (flaskDoc["message"] == "Attendance marked successfully!") {
                    http.begin(String(mongoServer) + "/students");
                    int studentHttpCode = http.GET();
                    if (studentHttpCode == 200) {
                        String payload = http.getString();
                        DynamicJsonDocument studentDoc(2048);
                        deserializeJson(studentDoc, payload);
                        for (JsonObject student : studentDoc.as<JsonArray>()) {
                            if (student["fingerprint_id"].as<String>() == matchedId) {
                                doc["status"] = "success";
                                doc["message"] = "Attendance marked!";
                                doc["fingerprint_id"] = matchedId;
                                doc["name"] = student["name"].as<String>();
                                doc["roll_no"] = student["roll_no"].as<String>();
                                Serial.println("Attendance successfully stored for " + student["name"].as<String>());
                                break;
                            }
                        }
                    } else {
                        doc["status"] = "failed";
                        doc["message"] = "Failed to fetch student data. HTTP Code: " + String(studentHttpCode);
                    }
                } else {
                    doc["status"] = "failed";
                    doc["message"] = "Flask error: " + flaskResponse;
                }
            } else {
                doc["status"] = "failed";
                doc["message"] = "Failed to mark attendance. HTTP Code: " + String(httpCode) + ", Response: " + flaskResponse;
            }
            http.end();
        } else {
            doc["status"] = "failed";
            doc["message"] = "WiFi disconnected.";
        }
    } else {
        doc["status"] = "failed";
        doc["message"] = "Fingerprint not recognized.";
    }
    serializeJson(doc, response);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
}

void handleVerifyLocal() {
    DynamicJsonDocument doc(256);
    String response;

    int p = -1;
    unsigned long startTime = millis();
    Serial.println("Waiting for finger (local verify)...");
    while (p != FINGERPRINT_OK && millis() - startTime < 10000) {
        p = finger.getImage();
        if (p == FINGERPRINT_NOFINGER) delay(100);
    }
    if (p != FINGERPRINT_OK) {
        doc["status"] = "failed";
        doc["message"] = "No finger detected within 10 seconds.";
        serializeJson(doc, response);
        server.send(200, "application/json", response);
        return;
    }

    p = finger.image2Tz();
    if (p != FINGERPRINT_OK) {
        doc["status"] = "failed";
        doc["message"] = "Image conversion error: " + String(p);
        serializeJson(doc, response);
        server.send(200, "application/json", response);
        return;
    }

    p = finger.fingerSearch();
    if (p == FINGERPRINT_OK) {
        String matchedId = String(finger.fingerID);
        Serial.println("Fingerprint matched locally - ID: " + matchedId);
        doc["status"] = "success";
        doc["message"] = "Fingerprint verified locally";
        doc["fingerprint_id"] = matchedId;
    } else {
        doc["status"] = "failed";
        doc["message"] = "Fingerprint not recognized.";
    }
    serializeJson(doc, response);
    server.send(200, "application/json", response);
}

void handleSubmit() {
    if (server.method() == HTTP_POST) {
        String body = server.arg("plain");
        DynamicJsonDocument doc(1024);
        deserializeJson(doc, body);

        String fingerprintId = doc["fingerprint_id"].as<String>();
        int id = fingerprintId.toInt();
        int p = finger.storeModel(id);
        if (p != FINGERPRINT_OK) {
            server.send(500, "text/plain", "Failed to store fingerprint.");
            return;
        }
        enrolledCount++;
        saveLastUsedId(id);

        if (WiFi.status() == WL_CONNECTED) {
            HTTPClient http;
            http.begin(String(mongoServer) + "/submit");
            http.addHeader("Content-Type", "application/json");
            int httpCode = http.POST(body);
            if (httpCode != 200) {
                finger.deleteModel(id);
                enrolledCount--;
                server.send(500, "text/plain", "Failed to store in MongoDB. HTTP Code: " + String(httpCode));
            } else {
                server.send(200, "text/plain", "Student enrolled successfully!");
            }
            http.end();
        } else {
            server.send(200, "text/plain", "Stored locally (WiFi disconnected)");
        }
    }
}

void handleStudents() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(String(mongoServer) + "/students");
        int httpCode = http.GET();
        if (httpCode == 200) {
            String payload = http.getString();
            server.send(200, "application/json", payload);
        } else {
            server.send(500, "text/plain", "Failed to fetch students");
        }
        http.end();
    } else {
        server.send(500, "text/plain", "WiFi not connected");
    }
}

void handleUpdate() {
    if (server.method() == HTTP_POST) {
        String body = server.arg("plain");
        if (WiFi.status() == WL_CONNECTED) {
            HTTPClient http;
            http.begin(String(mongoServer) + "/update");
            http.addHeader("Content-Type", "application/json");
            int httpCode = http.POST(body);
            if (httpCode == 200) {
                server.send(200, "text/plain", "Student updated successfully!");
            } else {
                server.send(500, "text/plain", "Failed to update student");
            }
            http.end();
        } else {
            server.send(500, "text/plain", "WiFi not connected");
        }
    }
}

void handleDelete() {
    if (server.method() == HTTP_POST) {
        String body = server.arg("plain");
        DynamicJsonDocument doc(256);
        deserializeJson(doc, body);
        String fingerprintId = doc["fingerprint_id"].as<String>();
        int id = fingerprintId.toInt();

        if (WiFi.status() == WL_CONNECTED) {
            HTTPClient http;
            http.begin(String(mongoServer) + "/delete");
            http.addHeader("Content-Type", "application/json");
            int httpCode = http.POST(body);
            if (httpCode == 200) {
                finger.deleteModel(id);
                enrolledCount--;
                server.send(200, "text/plain", "Student deleted successfully!");
            } else {
                server.send(500, "text/plain", "Failed to delete from MongoDB");
            }
            http.end();
        } else {
            finger.deleteModel(id);
            enrolledCount--;
            server.send(200, "text/plain", "Deleted locally (WiFi disconnected)");
        }
    }
}

void setup() {
    Serial.begin(115200);
    mySerial.begin(57600, SERIAL_8N1, RX_PIN, TX_PIN);

    finger.begin(57600);
    if (finger.verifyPassword()) {
        Serial.println("Fingerprint sensor found!");
    } else {
        Serial.println("Fingerprint sensor not detected!");
        while (1) delay(1000);
    }

    connectToWiFi();
    loadLastUsedId();

    server.on("/", handleRoot);
    server.on("/enroll", HTTP_POST, handleEnrollment);
    server.on("/verify", handleVerify);
    server.on("/verify-local", HTTP_POST, handleVerifyLocal);
    server.on("/submit", HTTP_POST, handleSubmit);
    server.on("/students", handleStudents);
    server.on("/update", HTTP_POST, handleUpdate);
    server.on("/delete", HTTP_POST, handleDelete);
    server.begin();
    Serial.println("ESP32 Web Server started!");
}

void loop() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi disconnected, attempting to reconnect...");
        connectToWiFi();
    }
    server.handleClient();
}