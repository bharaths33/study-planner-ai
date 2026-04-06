# STUDY PLANNER AI

## Project Report Draft

Prepared for the partial fulfillment of the requirements for the award of the degree of Bachelor of Engineering / Technology

Submitted by:

- Student Name 1: [First Student Name]
- Register Number: [Register Number]
- Student Name 2: [Student Name]
- Register Number: [Register Number]
- Student Name 3: [Student Name]
- Register Number: [Register Number]

Department: [Department Name]

Institution: [College Name]

Academic Year: [Year]

Guide:

- Internal Guide: [Guide Name], [Designation], [Department]
- External Guide: [Industry Guide Name, if applicable]

Important replacement notes:

- Use your official department format for cover page, inner title page, bonafide, declaration, and acknowledgement.
- In the individual copy, the first student name must match the first name shown on the cover page.
- Replace all placeholders before printing.

## Abstract

Academic planning is often handled manually by students through notebooks, static timetables, and unstructured online resources. This creates difficulties in goal setting, daily scheduling, progress tracking, and revision planning, especially when students prepare for examinations with different levels of prior knowledge. Existing tools may support to-do management or note taking, but many do not combine personalized study-plan generation, progress monitoring, revision support, and a simple student-facing dashboard in one lightweight system. The need of the present work is therefore to provide an accessible digital platform that helps students organize subject-wise preparation in a more systematic and adaptive manner.

This project presents **Study Planner AI**, a web-based application that assists students in creating and managing personalized study plans. The system was developed using a React-based frontend and a Node.js with Express backend connected to an SQLite database. The proposed solution supports user authentication, subject-wise plan generation, structured learning modules, completion tracking, learning analytics, study notes, quick tasks, motivation prompts, and a Pomodoro timer. The study-plan generation logic accepts subject name, exam date, hours per day, and current preparation level, then produces a modular roadmap with recommended subtopics, videos, mock tests, and supporting resources.

The implemented system was validated through functional testing of the major workflows including account creation, login, password reset, plan generation, plan storage, completion updates, notes management, and statistics retrieval. The application successfully maintained personalized plans for individual users, computed completion percentage from saved tasks, and displayed learning-support features in a unified dashboard. The outcome of the work is a practical academic assistance platform that improves planning visibility, encourages self-regulated learning, and reduces the effort required for study organization.

Keywords: study planner, personalized learning, learning analytics, self-regulated learning, academic dashboard, web application

## Chapter 1: Introduction

Digital learning environments have transformed the way students access academic content, prepare for examinations, and monitor their own learning progress. Despite the growth of online resources, many students still struggle to convert available content into structured daily action. They often know what to study, but not how much, in what sequence, and how to maintain consistency. This gap between content availability and practical planning creates a strong need for user-friendly academic planning systems.

### 1.1 Background of the Work

Personalized learning has gained importance because students differ in their prior knowledge, pace of study, examination deadlines, and preferred learning approaches. Recent work highlights that artificial intelligence and adaptive digital tools can improve personalization by aligning learning support with student needs (Merino-Campos, 2025). Research on learning analytics dashboards also shows that visual progress indicators and actionable feedback can strengthen student awareness and decision making (Masiello et al., 2024).

Traditional planning methods such as handwritten schedules, spreadsheets, or generic reminder apps are often disconnected from real study workflows. They rarely combine plan generation, task tracking, study duration awareness, and revision-oriented support in a single interface. For examination preparation, students usually need an integrated tool that can break a subject into manageable modules, save their progress, and provide motivational assistance.

### 1.2 Motivation

The motivation for this project arose from the common academic challenge of managing multiple subjects, limited time, and inconsistent follow-through. Many students start preparing with enthusiasm but lose structure after a few days because their plans are either too broad or too rigid. A practical solution must therefore do more than store tasks; it should guide students with a realistic roadmap and help them monitor completion continuously.

The proposed work addresses this challenge by developing a web platform that generates a study plan from simple inputs such as subject, exam date, study hours, and current level. It also improves usability by combining authentication, module tracking, notes, quick tasks, motivational tips, and time management tools in one dashboard. The overall aim is to support self-regulated learning through a system that is simple, affordable, and deployable in ordinary academic settings.

## Chapter 2: Literature Survey

The literature related to this project falls into four major areas: AI-enabled personalized learning, adaptive recommendation strategies, learning analytics dashboards, and self-regulated learning support. Together, these works establish the need for systems that do not merely deliver content, but also help learners plan, track, and reflect on their academic journey.

### 2.1 Artificial Intelligence in Personalized Learning

Merino-Campos (2025) presented a systematic review on the impact of artificial intelligence in personalized learning in higher education and noted that AI can support adaptive instruction, feedback, and pacing. Barrera Castro et al. (2025) identified pedagogical, technological, and psychological barriers that affect the success of personalized learning systems. These works support the idea that effective personalization should be practical, understandable, and student centered.

### 2.2 Adaptive and Context-Aware Recommendations

Abu-Rasheed et al. (2023) surveyed contextual indicators for personalized and adaptive learning recommendations and emphasized the role of learner profile and educational context. Zhou et al. (2023) discussed the broader growth of recommender systems based on deep learning. Although the present project uses rule-based plan generation, the system architecture creates a future pathway for more advanced recommendation logic using saved learner behavior and progress.

### 2.3 Learning Analytics Dashboards

Masiello et al. (2024) reviewed the use of learning analytics dashboards and highlighted their value in improving learner awareness and feedback quality. Sharif and Atif (2024) examined how learning analytics can shape individualized feedback in education. Tzimas and Demetriadis (2024) reported that guided learning analytics can positively influence self-regulated learning and student satisfaction. These findings justify the inclusion of progress bars, study statistics, and completion indicators in the proposed dashboard.

### 2.4 Self-Regulated Learning

Lobos et al. (2024) emphasized the importance of self-regulated learning support in higher education. Klašnja-Milićević et al. (2022) noted that learning analytics still faces challenges in translating data into useful study strategies. This indicates a practical gap that the present system attempts to address through notes, quick tasks, module completion, and time-management support.

### 2.5 Gap Identification and Problem Statement

The surveyed literature confirms progress in personalization, recommendation, and analytics-based feedback. However, a practical gap remains in lightweight student applications that combine authentication, personalized study-plan generation, progress tracking, notes, and productivity support within one deployable system.

Problem statement:

**To design and develop a web-based study planner that generates personalized study schedules, stores user progress, and provides actionable learning support features to improve self-regulated academic preparation.**

## Chapter 3: Proposed Work

### 3.1 Objectives of the Proposed Work

1. To design a user-friendly web application for academic study planning.
2. To generate personalized study plans based on subject, exam date, preparation level, and daily available time.
3. To provide secure student account management with login, signup, and password-reset support.
4. To store study plans, tasks, notes, and usage history persistently using a database.
5. To enable progress tracking through module completion, study statistics, and dashboard visualization.
6. To support self-regulated learning using notes, quick tasks, motivational prompts, and a Pomodoro timer.

### 3.2 Flow of the Proposed Work

1. The student creates an account or logs in.
2. The student enters subject name, exam date, study hours per day, and current level.
3. The backend generates a structured study plan with modules, subtopics, mock tests, tips, and links.
4. The generated plan is saved in the database and displayed on the dashboard.
5. The student marks modules as completed as study progresses.
6. The system updates progress percentage, completed counts, and study statistics.

### 3.3 Selection of Components and Tools

- Frontend: React with Vite
- Backend: Node.js with Express
- Database: SQLite
- Communication: JSON-based REST APIs
- Styling: component-based dashboard UI

The selected stack was chosen because it is lightweight, open source, easy to deploy, and suitable for an educational prototype.

## Chapter 4: System Design

The application follows a client-server architecture. The React frontend serves as the presentation layer, while the Express backend handles plan generation, authentication, persistence, and analytics. SQLite stores persistent records including users, plans, tasks, notes, and login history.

### 4.1 Functional Modules

- Authentication module
- Study-plan generation module
- Plan persistence and task module
- Analytics and dashboard module
- Notes and productivity support module

### 4.2 Database Design

The main tables used in the system are:

- `users`
- `plans`
- `tasks`
- `login_history`
- `study_notes`

This structure supports personalized plan storage, progress updates, note management, and simple student analytics.

## Chapter 5: Implementation

The frontend was built around two major interfaces: a login page and a personalized dashboard. The login screen supports sign-in, account creation, and password reset. The dashboard allows the user to generate a subject-wise plan, save it, view the roadmap, mark modules complete, add notes, track progress, and use a Pomodoro timer.

The backend provides API endpoints for authentication, plan generation, plan saving, plan retrieval, progress updates, statistics retrieval, and notes management. The plan-generation logic uses rule-based personalization by mapping the learner level to beginner, intermediate, or advanced study modules. Each plan includes topics, descriptions, subtopics, estimated hours, mock tests, and learning resources.

Progress percentage is computed using:

**Progress Percentage = (Completed Modules / Total Modules) x 100**

The prototype currently stores passwords directly and uses development-oriented settings. For production use, password hashing, stronger validation, and token-based authentication are recommended.

## Chapter 6: Testing and Validation

Functional testing was performed for the core workflows of the application. The tested operations included signup, login, password reset, plan generation, plan storage, plan retrieval, module completion updates, notes creation, notes deletion, and statistics retrieval.

The system successfully maintained user-specific plans and correctly reflected completion percentage and note content in the dashboard. The present validation is functional rather than large-scale experimental validation. Therefore, the findings establish software correctness and implementation feasibility rather than statistically measured learning impact across a student population.

## Chapter 7: Results and Discussion

The project produced a working prototype of a personalized study-planning platform. The system integrates account management, personalized plan generation, day-wise study modules, progress analytics, notes, and productivity aids in a single application. This confirms the feasibility of building a practical academic planner using a lightweight full-stack architecture.

The design is consistent with recent literature that emphasizes personalization, feedback visibility, and self-regulated learning support. A major strength of the system is the integration of multiple support features in one dashboard. A key limitation is that personalization is currently rule based rather than model driven. Another limitation is the absence of large-scale user studies and institutional deployment testing.

### 7.1 Significance, Strengths, and Limitations

Significance:

- provides a practical academic assistance platform for student self-use
- improves study visibility and task organization
- supports self-regulated learning behavior

Strengths:

- end-to-end student workflow
- simple interface
- lightweight database-backed persistence
- modular architecture suitable for enhancement

Limitations:

- no machine-learning personalization yet
- prototype-level security
- no long-term user-study results

### 7.2 Cost-Benefit Analysis

The development cost is relatively low because the system uses open-source technologies such as React, Node.js, Express, and SQLite. Deployment can be performed on a modest machine. The benefit is high for student users because the system reduces manual planning effort, improves visibility of learning progress, and supports consistent study routines.

## Chapter 8: Conclusion and Future Work

This project designed and developed **Study Planner AI**, a web-based application that supports students in organizing academic preparation through personalized study-plan generation and dashboard-based progress monitoring. The implemented system demonstrates that a compact full-stack application can provide meaningful study assistance by combining personalization, persistence, analytics, and productivity support.

### 8.1 Suggestions for Future Work

1. Introduce AI or machine-learning-based recommendation for deeper personalization.
2. Add secure password hashing and token-based authentication.
3. Include reminders, notifications, and calendar synchronization.
4. Add weak-topic detection and adaptive revision scheduling.
5. Conduct user studies with students to measure usability and academic impact.

## References

[1] Merino-Campos, C. (2025). The impact of artificial intelligence on personalized learning in higher education: A systematic review. *Trends in Higher Education, 4*(2), 17. https://doi.org/10.3390/higheredu4020017

[2] Barrera Castro, G. P., Chiappe, A., Ramírez-Montoya, M. S., & Alcántar Nieblas, C. (2025). Key barriers to personalized learning in times of artificial intelligence: A literature review. *Applied Sciences, 15*(6), 3103. https://doi.org/10.3390/app15063103

[3] Abu-Rasheed, H., Weber, C., & Fathi, M. (2023). Context based learning: A survey of contextual indicators for personalized and adaptive learning recommendations - a pedagogical and technical perspective. *Frontiers in Education, 8*, 1210968. https://doi.org/10.3389/feduc.2023.1210968

[4] Zhou, H., Xiong, F., & Chen, H. (2023). A comprehensive survey of recommender systems based on deep learning. *Applied Sciences, 13*(20), 11378. https://doi.org/10.3390/app132011378

[5] Masiello, I., Mohseni, Z., Palma, F., Nordmark, S., Augustsson, H., & Rundquist, R. (2024). A current overview of the use of learning analytics dashboards. *Education Sciences, 14*(1), 82. https://doi.org/10.3390/educsci14010082

[6] Sharif, H., & Atif, A. (2024). The evolving classroom: How learning analytics is shaping the future of education and feedback mechanisms. *Education Sciences, 14*(2), 176. https://doi.org/10.3390/educsci14020176

[7] Tzimas, D. E., & Demetriadis, S. N. (2024). Impact of learning analytics guidance on student self-regulated learning skills, performance, and satisfaction: A mixed methods study. *Education Sciences, 14*(1), 92. https://doi.org/10.3390/educsci14010092

[8] Lobos, K., Cobo-Rendón, R., Bruna Jofré, D., & Santana, J. (2024). New challenges for higher education: Self-regulated learning in blended learning contexts. *Frontiers in Education, 9*, 1457367. https://doi.org/10.3389/feduc.2024.1457367

[9] Klašnja-Milićević, A., Ivanović, M., Vesin, B., Satratzemi, M., & Wasson, B. (2022). Editorial: Learning analytics - trends and challenges. *Frontiers in Artificial Intelligence, 5*, 856807. https://doi.org/10.3389/frai.2022.856807

## Appendix

Add these before final submission:

1. Cover page in department format
2. Bonafide page
3. Declaration page
4. Acknowledgement page
5. Screenshots of login page, dashboard, plan page, notes section, and progress view
6. Work contribution table
7. Plagiarism report
