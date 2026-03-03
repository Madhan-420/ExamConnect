import requests
import time

BASE_URL = "http://localhost:8000"

def get_auth_token(email, password, role="student", full_name="Test User", reg_number="REG123"):
    # Try login first
    login_data = {"email": email, "password": password}
    r = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if r.status_code == 200:
        return r.json()["access_token"], r.json()["user"]["id"]
    
    # Register if login fails
    print(f"Login failed for {email}, trying to register...")
    reg_data = {
        "email": email, 
        "password": password, 
        "full_name": full_name, 
        "role": role, 
        "gender": "male",
        "reg_number": reg_number
    }
    r = requests.post(f"{BASE_URL}/api/auth/register", json=reg_data)
    if r.status_code != 200:
        print(f"Failed to register {email}: {r.text}")
        return None, None
    print(f"Registered {email}, trying login again...")
    
    r = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if r.status_code == 200:
        return r.json()["access_token"], r.json()["user"]["id"]
    print(f"Failed to login after registration for {email}: {r.text}")
    return None, None

def test_api():
    print("--- Starting Local API Tests ---")
    
    # 1. Setup Users
    admin_token, admin_id = get_auth_token("admin_test@example.com", "password123", "admin", "Admin Test")
    teacher_token, teacher_id = get_auth_token("teacher_test@example.com", "password123", "teacher", "Teacher Test")
    student_token, student_id = get_auth_token("student_test@example.com", "password123", "student", "Student Test", "S123")
    
    if not admin_token or not teacher_token or not student_token:
        print("Failed to setup users. Aborting test.")
        return
        
    print(f"Users setup successful. Admin ID: {admin_id}, Teacher ID: {teacher_id}, Student ID: {student_id}")
    
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}
    
    # 2. Test Mentor Assignment (Admin)
    print("\n--- Testing Mentor Assignment ---")
    r = requests.put(f"{BASE_URL}/api/admin/users/{student_id}/mentor?mentor_id={teacher_id}", headers=admin_headers)
    if r.status_code == 200:
        print("SUCCESS: Assigned teacher as mentor to student.")
    else:
        print(f"FAILED to assign mentor: {r.status_code} - {r.text}")
        
    # 3. Test Student Ping (Online Tracking)
    print("\n--- Testing Student Ping ---")
    r = requests.post(f"{BASE_URL}/api/auth/ping", headers=student_headers)
    if r.status_code == 200:
        print("SUCCESS: Student pinged successfully.")
    else:
        print(f"FAILED ping: {r.status_code} - {r.text}")
        
    # 4. Test Teacher viewing assigned students
    print("\n--- Testing Teacher My Students ---")
    r = requests.get(f"{BASE_URL}/api/teacher/my-students", headers=teacher_headers)
    if r.status_code == 200:
        students = r.json()
        print(f"SUCCESS: Teacher got {len(students)} assigned students.")
        if any(s['id'] == student_id for s in students):
            print("  -> Verified: Target student is in the list.")
        else:
            print("  -> FAILED: Target student NOT in the list.")
    else:
        print(f"FAILED to get students: {r.status_code} - {r.text}")
        
    # 5. Test Teacher Attendance
    print("\n--- Testing Teacher Attendance ---")
    today = "2026-03-03" # using a fixed date for the test
    att_payload = [{
        "student_id": student_id,
        "date": today,
        "status": "present",
        "remarks": "On time"
    }]
    r = requests.post(f"{BASE_URL}/api/teacher/attendance", headers=teacher_headers, json=att_payload)
    if r.status_code == 200:
        print("SUCCESS: Logged attendance.")
        
        # verify
        r_get = requests.get(f"{BASE_URL}/api/teacher/attendance?date={today}", headers=teacher_headers)
        if r_get.status_code == 200 and len(r_get.json()) > 0:
            print("  -> Verified: Fetched attendance successfully.")
        else:
            print(f"  -> FAILED: Could not fetch attendance. {r_get.text}")
    else:
        print(f"FAILED to log attendance: {r.status_code} - {r.text}")

    # 6. Test Teacher Internal Marks
    print("\n--- Testing Teacher Internal Marks ---")
    marks_payload = [{
        "student_id": student_id,
        "subject": "Physics",
        "marks": 85,
        "total_marks": 100
    }]
    r = requests.post(f"{BASE_URL}/api/teacher/internal-marks", headers=teacher_headers, json=marks_payload)
    if r.status_code == 200:
        print("SUCCESS: Logged internal marks.")
        
        # verify
        r_get = requests.get(f"{BASE_URL}/api/teacher/internal-marks?subject=Physics", headers=teacher_headers)
        if r_get.status_code == 200 and len(r_get.json()) > 0:
            print("  -> Verified: Fetched internal marks successfully.")
        else:
            print(f"  -> FAILED: Could not fetch internal marks. {r_get.text}")
    else:
        print(f"FAILED to log internal marks: {r.status_code} - {r.text}")
        
    # 7. Test Feedback
    print("\n--- Testing Feedback System ---")
    fb_payload = {
        "subject": "App Performance",
        "message": "The exam connect app is doing great!"
    }
    r = requests.post(f"{BASE_URL}/api/teacher/feedbacks", headers=teacher_headers, json=fb_payload)
    if r.status_code == 200:
        print("SUCCESS: Submitted feedback as teacher.")
    else:
        print(f"FAILED to submit feedback: {r.status_code} - {r.text}")
        
    # admin view
    r_admin = requests.get(f"{BASE_URL}/api/admin/feedbacks", headers=admin_headers)
    if r_admin.status_code == 200:
        fbs = r_admin.json()
        print(f"SUCCESS: Admin fetched {len(fbs)} feedbacks.")
    else:
        print(f"FAILED admin fetch feedbacks: {r_admin.status_code} - {r_admin.text}")
        
    print("\n--- Local Testing Complete ---")
    
if __name__ == "__main__":
    test_api()
