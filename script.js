const database = {
    javascript: {
        level1: [
            { q: "Which keyword defines a constant?", choices: ["var", "let", "const", "define"], a: "const" },
            { q: "Inside which HTML element do we put the JS?", choices: ["<js>", "<scripting>", "<script>", "<javascript>"], a: "<script>" },
            { q: "How do you write 'Hello World' in an alert box?", choices: ["msg('Hello')", "alert('Hello World')", "prompt('Hello')", "console.log('Hello')"], a: "alert('Hello World')" },
            { q: "How do you create a function?", choices: ["function:myFunc()", "function = myFunc()", "function myFunc()", "def myFunc()"], a: "function myFunc()" },
            { q: "How do you write an IF statement?", choices: ["if i = 5 then", "if i == 5 then", "if (i == 5)", "if i = 5"], a: "if (i == 5)" },
            { q: "How does a FOR loop start?", choices: ["for (i=0;i<5;i++)", "for (i=0;i<5)", "for i=1 to 5", "for (i<=5;i++)"], a: "for (i=0;i<5;i++)" },
            { q: "How do you add a comment?", choices: ["'Comment", "", "//Comment", "#Comment"], a: "//Comment" },
            { q: "What is the correct way to write an array?", choices: ["var colors = 'red','blue'", "var colors = ['red','blue']", "var colors = (1:'red', 2:'blue')"], a: "var colors = ['red','blue']" },
            { q: "How do you round 7.25 to the nearest integer?", choices: ["Math.rnd(7.25)", "round(7.25)", "Math.round(7.25)", "rnd(7.25)"], a: "Math.round(7.25)" },
            { q: "Which operator is used to assign a value?", choices: ["*", "-", "=", "x"], a: "=" }
        ],
        level2: [
            { q: "Which method joins two arrays?", choices: ["combine()", "concat()", "join()", "append()"], a: "concat()" },
            { q: "What is 'Hoisting'?", choices: ["Lifting weights", "Moving declarations to the top", "Deleting variables", "A type of loop"], a: "Moving declarations to the top" },
            { q: "What does 'NaN' stand for?", choices: ["Not a Number", "New and Next", "No available Name", "Node and Network"], a: "Not a Number" },
            { q: "Which 'typeof' returns 'object'?", choices: ["Array", "String", "Boolean", "Undefined"], a: "Array" },
            { q: "How do you stop a loop?", choices: ["stop", "exit", "break", "return"], a: "break" },
            { q: "Which is a 'Template Literal' symbol?", choices: ["'", '"', "`", "#"], a: "`" },
            { q: "What is a Closure?", choices: ["Closing a tab", "A function with its lexical environment", "An error", "A private variable"], a: "A function with its lexical environment" },
            { q: "How do you empty an array 'arr'?", choices: ["arr = 0", "arr.length = 0", "arr.empty()", "delete arr"], a: "arr.length = 0" },
            { q: "Which method removes the last element?", choices: ["pop()", "push()", "shift()", "last()"], a: "pop()" },
            { q: "What is the result of '2' + 2?", choices: ["4", "22", "undefined", "NaN"], a: "22" }
        ]
    },
    python: {
        level1: [
            { q: "How do you print 'Hello World'?", choices: ["echo 'Hello'", "p('Hello')", "print('Hello World')", "console.log('Hello')"], a: "print('Hello World')" },
            { q: "What is the correct file extension?", choices: [".pyt", ".py", ".pyw", ".pt"], a: ".py" },
            { q: "How do you create a variable?", choices: ["x = 5", "int x = 5", "var x = 5", "x := 5"], a: "x = 5" },
            { q: "Which one is a list?", choices: ["(1,2)", "{1,2}", "[1,2]", "<1,2>"], a: "[1,2]" },
            { q: "How do you start a function?", choices: ["function my()", "def my():", "void my()", "func my()"], a: "def my():" },
            { q: "Which is used for indentation?", choices: ["Tabs/Spaces", "Brackets", "Parentheses", "Colons"], a: "Tabs/Spaces" },
            { q: "How do you insert a comment?", choices: ["//", "/*", "#", "--"], a: "#" },
            { q: "Which operator is for power (2^3)?", choices: ["^", "**", "*", "//"], a: "**" },
            { q: "How do you get user input?", choices: ["get()", "scanf()", "input()", "read()"], a: "input()" },
            { q: "Which one is a string?", choices: ["'Hello'", "Hello", "123", "True"], a: "'Hello'" }
        ],
        level2: [
            { q: "Which method adds to a list?", choices: ["add()", "insert()", "append()", "plus()"], a: "append()" },
            { q: "What is a Tuple?", choices: ["Mutable list", "Immutable list", "A function", "A dictionary"], a: "Immutable list" },
            { q: "How do you find the length of 'x'?", choices: ["x.len()", "length(x)", "len(x)", "size(x)"], a: "len(x)" },
            { q: "Which is a Dictionary?", choices: ["[]", "()", "{}", "<>"], a: "{}" },
            { q: "How do you handle errors?", choices: ["try/except", "try/catch", "if/else", "error/handle"], a: "try/except" },
            { q: "What is a 'lambda'?", choices: ["A Greek letter", "An anonymous function", "A loop", "A class"], a: "An anonymous function" },
            { q: "Which keyword creates a class?", choices: ["object", "construct", "class", "def"], a: "class" },
            { q: "How do you import a module?", choices: ["using math", "include math", "import math", "get math"], a: "import math" },
            { q: "Result of 10 // 3?", choices: ["3.33", "3", "1", "0"], a: "3" },
            { q: "Which is a Boolean?", choices: ["'True'", "true", "True", "1"], a: "True" }
        ]
    }
};

// Logic variables
let user = { name: "", score: 0, level: 1, category: "" };
let currentQIndex = 0;
let currentQuestions = [];

// Functions
const startQuiz = () => {
    const name = document.getElementById('user-name').value;
    if (!name) return alert("Please enter name");
    user.name = name;
    user.category = document.getElementById('category-select').value;
    loadLevel(1);
};

const loadLevel = (levelNum) => {
    user.level = levelNum;
    const levelKey = `level${levelNum}`;
    currentQuestions = database[user.category][levelKey];
    currentQIndex = 0;
    
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    showQuestion();
};

function showQuestion() {
    const data = currentQuestions[currentQIndex];
    document.getElementById('display-level').innerText = `Level: ${user.level}`;
    document.getElementById('display-score').innerText = `Score: ${user.score}`;
    document.getElementById('question-text').innerText = `(${currentQIndex + 1}/10) ${data.q}`;
    
    const container = document.getElementById('choices-container');
    container.innerHTML = "";

    data.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.innerText = choice;
        btn.classList.add('choice-btn');
        btn.onclick = () => checkChoice(choice, btn);
        container.appendChild(btn);
    });
}

function checkChoice(choice, btn) {
    const correct = currentQuestions[currentQIndex].a;
    const btns = document.querySelectorAll('.choice-btn');
    btns.forEach(b => b.disabled = true);

    if (choice === correct) {
        btn.classList.add('correct');
        user.score += 10;
    } else {
        btn.classList.add('wrong');
        btns.forEach(b => { if(b.innerText === correct) b.classList.add('correct'); });
    }

    setTimeout(() => {
        currentQIndex++;
        if (currentQIndex < currentQuestions.length) {
            showQuestion();
        } else {
            // Check if there is a next level
            const nextLevel = user.level + 1;
            if (database[user.category][`level${nextLevel}`]) {
                alert(`Level ${user.level} Complete! Moving to Level ${nextLevel}`);
                loadLevel(nextLevel);
            } else {
                finish();
            }
        }
    }, 1500);
}

function finish() {
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');
    document.getElementById('final-stats').innerText = `${user.name}, you scored ${user.score} points and mastered all levels!`;
}

document.getElementById('start-btn').onclick = startQuiz;