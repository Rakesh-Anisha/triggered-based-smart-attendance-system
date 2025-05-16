import pandas as pd
import random
import numpy as np

# Sample data generation
data = []
programs = ['BCA', 'MCA', 'BTECH', 'MTECH']
subjects = ['c', 'math', 'web-d', 'dsa']
months = ['Jan-24', 'Feb-24', 'Mar-24', 'Apr-24', 'May-24', 'Jun-24',
          'Jul-24', 'Aug-24', 'Sep-24', 'Oct-24', 'Nov-24', 'Dec-24']

for program in programs:
    roll_number_counter = 1  # Reset for each program
    for i in range(100):  # 100 students per program
        roll_no = f"UG/02/{program}/2022/{roll_number_counter:03d}"
        roll_number_counter += 1
        department = "cse"
        student_subject_data = []

        # Assign a "student type" (good, average, poor, very poor)
        student_type = random.choices(
            ['good', 'average', 'poor', 'very poor'],
            weights=[0.4, 0.4, 0.15, 0.05],  # 40% good, 40% average, 15% poor, 5% very poor
            k=1
        )[0]

        for subject in subjects:
            row = {
                'roll_no': roll_no,
                'department': department,
                'program': program,
                'subject': subject
            }
            for month in months:
                if student_type == 'good':
                    base_attendance = random.randint(85, 100)
                elif student_type == 'average':
                    base_attendance = random.randint(65, 85)
                elif student_type == 'poor':
                    base_attendance = random.randint(40, 65)
                else:  # very poor
                    base_attendance = random.randint(20, 40)

                # Add noise
                noisy_attendance = base_attendance + np.random.normal(loc=0, scale=5)
                # Clip between 0 and 100
                noisy_attendance = min(max(noisy_attendance, 0), 100)
                row[month] = round(noisy_attendance, 2)

            student_subject_data.append(row)

        # Calculate average attendance
        total_attendance = sum(
            sum(subject[month] for month in months)
            for subject in student_subject_data
        )
        num_entries = len(subjects) * len(months)
        avg_attendance = total_attendance / num_entries

        # Determine if debarred
        debarred = 1 if avg_attendance < 75 else 0

        # Add debarred to each subject row
        for row in student_subject_data:
            row['debarred'] = debarred
            data.append(row)

# Save to CSV
df = pd.DataFrame(data)
df.to_csv("dataset.csv", index=False)
print("✅ dataset.csv created successfully with realistic randomness!")
