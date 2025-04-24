import pandas as pd
import random
from datetime import datetime, timedelta
import pytz

# Define the start and end dates of the semester
start_date = datetime(2025, 1, 2)
end_date = datetime(2025, 4, 22)

# Define the timezone (UTC in this case)
timezone = pytz.UTC

# Define the days of the week that are weekdays (Mon-Fri)
total_weekdays = pd.date_range(start=start_date, end=end_date, freq='B')  # 'B' frequency excludes weekends
total_weekdays = total_weekdays.tz_localize(timezone)  # Make all total_weekdays timezone-aware

# Programs, Subjects, and Students
programs = ['BCA', 'MCA', 'BTech', 'MTech']
subjects = ['C', 'Math']
students = ['Student 1', 'Student 2', 'Student 3', 'Student 4', 'Student 5', 'Student 6', 'Student 7', 'Student 8', 'Student 9', 'Student 10']

# Generate a sample attendance record
records = []
for student_id, student in enumerate(students, start=1):
    for subject in subjects:
        # Randomly generate 20 attended days (ensure they fall within the total weekdays)
        attended_days = set([start_date + timedelta(days=random.randint(0, len(total_weekdays)-1)) for _ in range(20)])
        
        for day in total_weekdays:
            present = day.date() in [attend_day.date() for attend_day in attended_days]  # Ensure comparing only dates
            records.append({
                "student_id": student_id,
                "student_name": student,
                "program_name": programs[student_id % len(programs)],
                "subject_name": subject,
                "timestamp": day.strftime('%Y-%m-%dT%H:%M:%S+00:00'),  # Correct timestamp format
                "present": present
            })

# Convert to DataFrame
df_logs = pd.DataFrame(records)

# Calculate training data for attendance prediction
training_data = []

for (student_id, subject), group in df_logs.groupby(["student_id", "subject_name"]):
    group = group.sort_values("timestamp")
    classes_attended = 0
    total_classes_for_subject = len(group)  # Total number of classes for this subject
    
    for idx, row in enumerate(group.itertuples(), 1):
        if row.present:
            classes_attended += 1
        
        # Convert current_date from timestamp string (ISO format) to aware datetime
        current_date = datetime.fromisoformat(row.timestamp)  # This will be aware if timestamp has timezone info
        
        # Check if the current_date is naive or aware
        if current_date.tzinfo is None:
            current_date = timezone.localize(current_date)  # Make sure current_date is timezone-aware if it's naive
        
        # Dynamically calculate classes held so far (number of weekdays up to the current date)
        classes_held_so_far = len([date for date in total_weekdays if date <= current_date])  # Count weekdays until current date
        
        attendance_pct_so_far = (classes_attended / classes_held_so_far) * 100 if classes_held_so_far > 0 else 0
        remaining_classes = total_classes_for_subject - classes_held_so_far  # Update remaining classes
        
        # Calculate predicted attendance by the end of the semester
        predicted_attendance_pct = (classes_attended + remaining_classes) / total_classes_for_subject * 100
        predicted_debarred = 1 if predicted_attendance_pct < 75 else 0
        
        training_data.append({
            "program_name": row.program_name,
            "subject_name": subject,
            "date": row.timestamp[:10],  # Extract only date part
            "classes_held_so_far": classes_held_so_far,
            "classes_attended_so_far": classes_attended,
            "attendance_percentage_so_far": round(attendance_pct_so_far, 2),
            "remaining_classes": remaining_classes,
            "predicted_debarred": predicted_debarred
        })

# Convert to DataFrame
df_training = pd.DataFrame(training_data)

# Save to CSV
df_training.to_csv('attendance_training_with_dynamic_classes_held.csv', index=False)

# Show the first few rows as sample output
print(df_training.head(10))
