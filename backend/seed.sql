USE course_management;


-- ======================================================
-- SEED USERS
-- ======================================================

INSERT INTO users
(
    username,
    password,
    full_name,
    role
)
VALUES

(
    'admin',
    '$2b$10$C5S4lHqwweU5DK0S5GCQQe0oRcYsTL3Q56Pt0v4OymtoX.X8VGj2G',
    'System Administrator',
    'admin'
),

(
    'kamal',
    '$2b$10$C5S4lHqwweU5DK0S5GCQQe0oRcYsTL3Q56Pt0v4OymtoX.X8VGj2G',
    'Kamal Perera',
    'student'
),

(
    'nimal',
    '$2b$10$C5S4lHqwweU5DK0S5GCQQe0oRcYsTL3Q56Pt0v4OymtoX.X8VGj2G',
    'Nimal Silva',
    'student'
),

(
    'saman',
    '$2b$10$C5S4lHqwweU5DK0S5GCQQe0oRcYsTL3Q56Pt0v4OymtoX.X8VGj2G',
    'Saman Fernando',
    'student'
);


-- ======================================================
-- SEED COURSES
-- ======================================================

INSERT INTO courses
(
    title,
    category,
    level,
    duration,
    price,
    image,
    description,
    max_students
)
VALUES

(
    'HTML & CSS',
    'Frontend',
    'Beginner',
    '8 Weeks',
    15000,
    'https://placehold.co/300x180?text=HTML+%26+CSS',
    'Learn the fundamentals of HTML5 and CSS3 to build modern, responsive websites.',
    2
),

(
    'JavaScript',
    'Frontend',
    'Intermediate',
    '10 Weeks',
    18000,
    'https://placehold.co/300x180?text=JavaScript',
    'Master JavaScript, the DOM, events, ES6 features, and asynchronous programming.',
    NULL
),

(
    'Node.js',
    'Backend',
    'Intermediate',
    '12 Weeks',
    22000,
    'https://placehold.co/300x180?text=Node.js',
    'Build fast and scalable server-side applications using Node.js.',
    NULL
),

(
    'Express.js',
    'Backend',
    'Advanced',
    '8 Weeks',
    20000,
    'https://placehold.co/300x180?text=Express.js',
    'Create RESTful APIs and web applications using the Express framework.',
    NULL
),

(
    'MongoDB',
    'Database',
    'Intermediate',
    '6 Weeks',
    17000,
    'https://placehold.co/300x180?text=MongoDB',
    'Learn NoSQL database design, CRUD operations, and MongoDB integration.',
    NULL
),

(
    'MySQL',
    'Database',
    'Beginner',
    '6 Weeks',
    16000,
    'https://placehold.co/300x180?text=MySQL',
    'Understand relational databases, SQL queries, joins, and database normalization.',
    NULL
),

(
    'React',
    'Frontend',
    'Advanced',
    '10 Weeks',
    25000,
    'https://placehold.co/300x180?text=React',
    'Develop modern single-page applications using React components and hooks.',
    NULL
),

(
    'Full Stack Web Development',
    'Full Stack',
    'Advanced',
    '20 Weeks',
    45000,
    'https://placehold.co/300x180?text=Full+Stack',
    'Combine frontend, backend, databases, authentication, and deployment into one complete project.',
    NULL
);


-- ======================================================
-- SEED ENROLLMENTS
-- ======================================================

-- User IDs:
-- 1 = Admin
-- 2 = Kamal Perera
-- 3 = Nimal Silva
-- 4 = Saman Fernando

-- Course IDs:
-- 1 = HTML & CSS
-- 2 = JavaScript
-- 3 = Node.js
-- 4 = Express.js
-- 5 = MongoDB
-- 6 = MySQL
-- 7 = React
-- 8 = Full Stack Web Development


INSERT INTO enrollments
(
    student_id,
    course_id
)
VALUES

-- Kamal
(2, 1),
(2, 2),
(2, 6),

-- Nimal
(3, 3),
(3, 4),

-- Saman
(4, 2),
(4, 7);