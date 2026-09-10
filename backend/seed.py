import os
import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone

# Add parent directory to sys.path so we can import backend packages
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.core.security import hash_password
from backend.app.models.user import User
from backend.app.models.subject import Subject
from backend.app.models.class_model import Class
from backend.app.models.class_student import ClassStudent
from backend.app.models.assignment import Assignment
from backend.app.models.submission import Submission
from backend.app.models.notification import Notification

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf(filepath: Path, doc_title: str, subtitle: str, body_sections: list):
    filepath.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(filepath), pagesize=letter, rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=20
    )
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontSize=10,
        leading=15,
        textColor=colors.HexColor("#334155"),
        spaceAfter=10
    )

    story = [
        Paragraph(doc_title, title_style),
        Paragraph(subtitle, subtitle_style),
        Spacer(1, 10)
    ]

    for section_title, section_text in body_sections:
        story.append(Paragraph(section_title, heading_style))
        story.append(Paragraph(section_text, body_style))
        story.append(Spacer(1, 6))

    doc.build(story)

def run_seed():
    print("\n=======================================================")
    print("  STUDENT TASK & ASSIGNMENT MANAGEMENT SYSTEM SEEDER   ")
    print("=======================================================\n")

    print("[1/6] Recreating database schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # Ensure uploads directory structure exists
    questions_dir = settings.uploads_path / "questions"
    submissions_dir = settings.uploads_path / "submissions"
    avatars_dir = settings.uploads_path / "avatars"

    db = SessionLocal()
    now = datetime.now(timezone.utc)

    try:
        print("[2/6] Seeding users...")
        admin = User(
            email="admin@classroom.edu",
            password_hash=hash_password("Admin@123"),
            full_name="Prof. Robert Sterling",
            role="admin",
            phone="+1 (555) 234-5678",
            bio="Head of Computer Science & Engineering. Passionate about algorithms, distributed systems, and modern software architectures.",
            is_active=True
        )
        db.add(admin)

        student1 = User(
            email="john.doe@student.edu",
            password_hash=hash_password("Student@123"),
            full_name="John Doe",
            role="student",
            phone="+1 (555) 345-6789",
            bio="Third year Computer Science undergraduate interested in full-stack web and systems programming.",
            is_active=True
        )
        student2 = User(
            email="jane.smith@student.edu",
            password_hash=hash_password("Student@123"),
            full_name="Jane Smith",
            role="student",
            phone="+1 (555) 456-7890",
            bio="Software engineering student with a strong focus on data engineering and cloud architectures.",
            is_active=True
        )
        student3 = User(
            email="alex.wilson@student.edu",
            password_hash=hash_password("Student@123"),
            full_name="Alex Wilson",
            role="student",
            phone="+1 (555) 567-8901",
            bio="Junior developer studying relational database performance and high-performance computing.",
            is_active=True
        )
        student4 = User(
            email="sarah.jenkins@student.edu",
            password_hash=hash_password("Student@123"),
            full_name="Sarah Jenkins",
            role="student",
            phone="+1 (555) 678-9012",
            bio="Undergraduate student exploring artificial intelligence and algorithmic problem solving.",
            is_active=True
        )

        db.add_all([student1, student2, student3, student4])
        db.commit()
        db.refresh(admin)
        db.refresh(student1)
        db.refresh(student2)
        db.refresh(student3)
        db.refresh(student4)

        print("[3/6] Seeding subjects & classes...")
        sub_cs = Subject(
            name="Computer Science Principles",
            code="CS-100",
            description="Foundations of computation, control structures, and software engineering design principles.",
            created_by_id=admin.id
        )
        sub_dsa = Subject(
            name="Data Structures & Algorithms",
            code="CS-201",
            description="Advanced analysis of algorithms, linear and non-linear data structures, trees, graphs, and dynamic programming.",
            created_by_id=admin.id
        )
        sub_dbms = Subject(
            name="Database Management Systems",
            code="DBMS-301",
            description="Relational data modeling, SQL optimization, normalization, indexing, transaction processing, and ACID properties.",
            created_by_id=admin.id
        )
        sub_math = Subject(
            name="Applied Discrete Mathematics",
            code="MATH-102",
            description="Discrete probability, combinatorics, graph theory, and proof techniques relevant to modern computing.",
            created_by_id=admin.id
        )
        db.add_all([sub_cs, sub_dsa, sub_dbms, sub_math])
        db.commit()
        db.refresh(sub_cs)
        db.refresh(sub_dsa)
        db.refresh(sub_dbms)

        class1 = Class(
            subject_id=sub_cs.id,
            name="CS 101 - Section Alpha",
            section="A",
            code="CS101-A",
            semester="Fall 2026",
            schedule="Mon & Wed 10:00 AM - 11:30 AM",
            max_students=45,
            created_by_id=admin.id,
            is_active=True
        )
        class2 = Class(
            subject_id=sub_dsa.id,
            name="DSA 201 - Advanced Lab",
            section="B",
            code="DSA201-B",
            semester="Fall 2026",
            schedule="Tue & Thu 02:00 PM - 03:30 PM",
            max_students=50,
            created_by_id=admin.id,
            is_active=True
        )
        class3 = Class(
            subject_id=sub_dbms.id,
            name="DBMS 301 - Core Relational Architecture",
            section="A",
            code="DBMS301-A",
            semester="Fall 2026",
            schedule="Friday 09:00 AM - 12:00 PM",
            max_students=40,
            created_by_id=admin.id,
            is_active=True
        )
        db.add_all([class1, class2, class3])
        db.commit()
        db.refresh(class1)
        db.refresh(class2)
        db.refresh(class3)

        print("[4/6] Enrolling students into classes...")
        enrollments = [
            ClassStudent(class_id=class1.id, student_id=student1.id),
            ClassStudent(class_id=class1.id, student_id=student2.id),
            ClassStudent(class_id=class1.id, student_id=student3.id),
            ClassStudent(class_id=class2.id, student_id=student1.id),
            ClassStudent(class_id=class2.id, student_id=student4.id),
            ClassStudent(class_id=class3.id, student_id=student2.id),
            ClassStudent(class_id=class3.id, student_id=student3.id),
        ]
        db.add_all(enrollments)
        db.commit()

        print("[5/6] Generating sample assignment question PDFs & Assignments...")
        # PDF 1
        asg1_pdf_filename = "cs101_asg1_python_fundamentals.pdf"
        generate_pdf(
            questions_dir / asg1_pdf_filename,
            "CS 101: Assignment 1 - Python Fundamentals",
            "Department of Computer Science | Maximum Marks: 100",
            [
                ("Problem 1: Control Flow & Conditionals (30 Marks)",
                 "Implement a command-line utility in Python that reads student grades from an input string, computes weighted GPA, and categorizes performance according to the institutional grading scale."),
                ("Problem 2: Recursion & Memoization (35 Marks)",
                 "Write a recursive solution to compute the N-th Fibonacci sequence value with top-down memoization. Compare execution time between standard recursion and memoized calls."),
                ("Problem 3: File I/O & Error Handling (35 Marks)",
                 "Design a script that reads a CSV dataset of server access logs, parses HTTP status codes, and outputs an error frequency report while gracefully handling missing files.")
            ]
        )

        # PDF 2
        asg2_pdf_filename = "cs101_asg2_loops_and_data_structures.pdf"
        generate_pdf(
            questions_dir / asg2_pdf_filename,
            "CS 101: Assignment 2 - Loops and Data Structures",
            "Department of Computer Science | Maximum Marks: 100",
            [
                ("Problem 1: List Comprehensions & Filter Maps (40 Marks)",
                 "Demonstrate concise data transformation workflows utilizing Python list comprehensions and generator expressions."),
                ("Problem 2: Dictionary Inversion & Frequency Counters (60 Marks)",
                 "Implement word count analysis across multi-paragraph documents and invert the mapping to group words with identical frequencies.")
            ]
        )

        # PDF 3
        asg3_pdf_filename = "dsa201_asg1_binary_trees.pdf"
        generate_pdf(
            questions_dir / asg3_pdf_filename,
            "DSA 201: Assignment 1 - Binary Search Tree Operations",
            "Advanced Lab | Maximum Marks: 100",
            [
                ("Task 1: BST Node Deletion (50 Marks)",
                 "Implement in-place deletion of nodes with two children using in-order successors. Prove O(h) complexity."),
                ("Task 2: Level-Order Traversal (50 Marks)",
                 "Write an iterative BFS traversal using a double-ended queue. Output nodes grouped by level depth.")
            ]
        )

        # PDF 4
        asg4_pdf_filename = "dbms301_asg1_normalization.pdf"
        generate_pdf(
            questions_dir / asg4_pdf_filename,
            "DBMS 301: Assignment 1 - SQL Schema Design & 3NF Normalization",
            "Relational Architecture | Maximum Marks: 100",
            [
                ("Question 1: Functional Dependencies (40 Marks)",
                 "Given an unnormalized healthcare record schema, identify all candidate keys and minimal covers of functional dependencies."),
                ("Question 2: BCNF Decomposition (60 Marks)",
                 "Decompose the universal relation into Boyce-Codd Normal Form while ensuring lossless-join and dependency preservation properties.")
            ]
        )

        # Create Assignment Records
        asg1 = Assignment(
            class_id=class1.id,
            title="Python Fundamentals & Problem Solving",
            description="Core concepts of Python syntax, functions, file input/output, and algorithmic logic.",
            question_text="Complete all 3 questions outlined in the attached PDF. Submit your solution as a single consolidated PDF report with clean code snippets and execution screenshots.",
            question_file_url=f"/uploads/questions/{asg1_pdf_filename}",
            total_marks=100,
            due_date=now + timedelta(days=5),
            created_by_id=admin.id
        )

        asg2 = Assignment(
            class_id=class1.id,
            title="Loops, Collections & Functional Transformations",
            description="Deep dive into lists, dictionaries, tuples, sets, and comprehension patterns.",
            question_text="Solve the problems from the attached PDF. Ensure all unit test cases are documented with outputs.",
            question_file_url=f"/uploads/questions/{asg2_pdf_filename}",
            total_marks=100,
            due_date=now - timedelta(days=2),  # Past due to test Late submissions
            created_by_id=admin.id
        )

        asg3 = Assignment(
            class_id=class2.id,
            title="Binary Search Trees & Traversal Algorithms",
            description="Implementation of balanced BST methods including deletion, search, and iterative level-order traversal.",
            question_text="Implement all tree operations with theoretical proofs of time and space complexity.",
            question_file_url=f"/uploads/questions/{asg3_pdf_filename}",
            total_marks=100,
            due_date=now + timedelta(days=7),
            created_by_id=admin.id
        )

        asg4 = Assignment(
            class_id=class3.id,
            title="Relational Schema Normalization & BCNF",
            description="Decomposing database tables to eliminate insertion, deletion, and modification anomalies.",
            question_text="Formal mathematical proofs of functional dependencies and SQL DDL schemas for 3NF and BCNF.",
            question_file_url=f"/uploads/questions/{asg4_pdf_filename}",
            total_marks=100,
            due_date=now + timedelta(days=12),
            created_by_id=admin.id
        )

        db.add_all([asg1, asg2, asg3, asg4])
        db.commit()
        db.refresh(asg1)
        db.refresh(asg2)
        db.refresh(asg3)
        db.refresh(asg4)

        print("[6/6] Seeding sample student solution PDFs & Submissions...")
        # Solution 1: John Doe for Assignment 2 (Submitted before deadline, Graded Completed)
        sol1_filename = "sol_asg2_john_doe.pdf"
        generate_pdf(
            submissions_dir / sol1_filename,
            "Solution: CS 101 Assignment 2",
            "Submitted by John Doe (john.doe@student.edu)",
            [
                ("Solution to Problem 1", "Comprehensive implementation of list comprehensions and memory-efficient iterators."),
                ("Solution to Problem 2", "Inverted index mapping constructed with O(N) linear dictionary traversal and verified against edge cases.")
            ]
        )
        sub1 = Submission(
            assignment_id=asg2.id,
            student_id=student1.id,
            solution_file_url=f"/uploads/submissions/{sol1_filename}",
            submission_text="Submitted all required algorithms with test suite verification and time benchmarks.",
            status="Completed",
            marks_awarded=96.0,
            feedback="Exceptional work! Very clean code structure, thorough comments, and comprehensive edge-case testing.",
            submitted_at=now - timedelta(days=3),
            graded_at=now - timedelta(days=1)
        )

        # Solution 2: Jane Smith for Assignment 2 (Submitted after deadline -> Late)
        sol2_filename = "sol_asg2_jane_smith.pdf"
        generate_pdf(
            submissions_dir / sol2_filename,
            "Solution: CS 101 Assignment 2",
            "Submitted by Jane Smith (jane.smith@student.edu)",
            [
                ("Solution Overview", "Complete answers for frequency counters and dictionary transformations.")
            ]
        )
        sub2 = Submission(
            assignment_id=asg2.id,
            student_id=student2.id,
            solution_file_url=f"/uploads/submissions/{sol2_filename}",
            submission_text="Submitted late due to network maintenance. Included all source codes.",
            status="Late",
            marks_awarded=88.0,
            feedback="Great technical accuracy. Deducted 5 marks for late submission as per course syllabus.",
            submitted_at=now - timedelta(days=1),
            graded_at=now - timedelta(hours=6)
        )

        # Solution 3: Alex Wilson for Assignment 1 (Submitted, awaiting grading)
        sol3_filename = "sol_asg1_alex_wilson.pdf"
        generate_pdf(
            submissions_dir / sol3_filename,
            "Solution: CS 101 Assignment 1 - Python Fundamentals",
            "Submitted by Alex Wilson (alex.wilson@student.edu)",
            [
                ("Execution Details", "Full code listing and output terminal logs for Fibonacci memoization and log parser.")
            ]
        )
        sub3 = Submission(
            assignment_id=asg1.id,
            student_id=student3.id,
            solution_file_url=f"/uploads/submissions/{sol3_filename}",
            submission_text="All 3 problems solved and checked against sample input datasets.",
            status="Submitted",
            marks_awarded=None,
            feedback=None,
            submitted_at=now - timedelta(hours=4),
            graded_at=None
        )

        db.add_all([sub1, sub2, sub3])
        db.commit()

        # Seed realistic notifications
        notifications = [
            Notification(
                user_id=admin.id,
                title="New Submission: Python Fundamentals",
                message=f"Alex Wilson submitted their solution for '{asg1.title}'.",
                type="submission_received",
                link=f"/admin/assignments/{asg1.id}/submissions",
                is_read=False,
                created_at=now - timedelta(hours=4)
            ),
            Notification(
                user_id=admin.id,
                title="Late Submission Received",
                message=f"Jane Smith submitted late for '{asg2.title}'.",
                type="submission_received",
                link=f"/admin/assignments/{asg2.id}/submissions",
                is_read=True,
                created_at=now - timedelta(days=1)
            ),
            Notification(
                user_id=student1.id,
                title="Assignment Graded: Loops & Collections",
                message=f"Your submission for '{asg2.title}' was reviewed. Marks: 96/100.",
                type="submission_graded",
                link=f"/student/assignments/{asg2.id}",
                is_read=False,
                created_at=now - timedelta(days=1)
            ),
            Notification(
                user_id=student1.id,
                title="New Assignment: Python Fundamentals",
                message=f"Prof. Robert Sterling published a new assignment in {class1.name}.",
                type="assignment_new",
                link=f"/student/assignments/{asg1.id}",
                is_read=True,
                created_at=now - timedelta(days=2)
            ),
            Notification(
                user_id=student2.id,
                title="New Assignment: Python Fundamentals",
                message=f"Prof. Robert Sterling published a new assignment in {class1.name}.",
                type="assignment_new",
                link=f"/student/assignments/{asg1.id}",
                is_read=False,
                created_at=now - timedelta(days=2)
            )
        ]
        db.add_all(notifications)
        db.commit()

        print("\n=======================================================")
        print("           DATABASE SEEDED SUCCESSFULLY!               ")
        print("=======================================================\n")
        print("Login Credentials:")
        print("-------------------------------------------------------------------------------------------------")
        print(f"| {'ROLE':<8} | {'FULL NAME':<24} | {'EMAIL':<28} | {'PASSWORD':<12} |")
        print("-------------------------------------------------------------------------------------------------")
        print(f"| {'Admin':<8} | {'Prof. Robert Sterling':<24} | {'admin@classroom.edu':<28} | {'Admin@123':<12} |")
        print(f"| {'Student':<8} | {'John Doe':<24} | {'john.doe@student.edu':<28} | {'Student@123':<12} |")
        print(f"| {'Student':<8} | {'Jane Smith':<24} | {'jane.smith@student.edu':<28} | {'Student@123':<12} |")
        print(f"| {'Student':<8} | {'Alex Wilson':<24} | {'alex.wilson@student.edu':<28} | {'Student@123':<12} |")
        print(f"| {'Student':<8} | {'Sarah Jenkins':<24} | {'sarah.jenkins@student.edu':<28} | {'Student@123':<12} |")
        print("-------------------------------------------------------------------------------------------------")
        print(f"\nClass Join Codes:")
        print(f"  * {class1.name}: {class1.code}")
        print(f"  * {class2.name}: {class2.code}")
        print(f"  * {class3.name}: {class3.code}\n")

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
