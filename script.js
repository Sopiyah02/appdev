// ACCOUNTS
const accounts = { admin:{user:"admin", pass:"1234"}, manager:{user:"manager", pass:"5678"} };

// PLAYERS
let players = [];
let currentPlayer = null;

// DATABASE
const database = {
    javascript:{
        level1:[{q:"Which keyword defines a constant?", choices:["var","let","const","define"], a:"const"},
                {q:"Inside which HTML element do we put the JS?", choices:["<js>","<scripting>","<script>","<javascript>"], a:"<script>"}],
        level2:[{q:"Which method joins arrays?", choices:["concat()","join()","push()"], a:"concat()"}]
    },
    python:{
        level1:[{q:"How do you print 'Hello World'?", choices:["print()","echo()","log()"], a:"print()"}],
        level2:[{q:"Which keyword creates a function?", choices:["func","def","function"], a:"def"}]
    }
};

// QUIZ VARS
let index=0, score=0, level=1, category="javascript", currentQuestions=[], playerAvatar="";

// AVATAR SELECT
document.querySelectorAll('.avatar').forEach(img=>{
    img.addEventListener('click', ()=>{
        playerAvatar = img.src;
        document.querySelectorAll('.avatar').forEach(a=>a.classList.remove('selected'));
        img.classList.add('selected');
    });
});

// TOGGLE ADMIN/MANAGER LOGIN
function toggleAdminManager(){
    document.getElementById('admin-manager-login').classList.toggle('hidden');
}

// PLAYER LOGIN
function loginPlayer(){
    const username=document.getElementById('username').value.trim();
    category=document.getElementById('category').value;

    if(!username){ alert("Enter username"); return; }
    if(!playerAvatar){ alert("Select an avatar"); return; }

    currentPlayer={name:username, score:0, avatar:playerAvatar, category};
    players.push(currentPlayer);

    hideAllPanels();
    document.getElementById('player-dashboard').classList.remove('hidden');
    document.getElementById('dashboard-avatar').src=playerAvatar;
    document.getElementById('dashboard-name').innerText=username;
    document.getElementById('dashboard-score').innerText="Score: 0";
}

// ADMIN LOGIN
function loginAdmin(){
    const user=document.getElementById('admin-user').value;
    const pass=document.getElementById('admin-pass').value;

    if(user===accounts.admin.user && pass===accounts.admin.pass){
        hideAllPanels();
        document.getElementById('admin-panel').classList.remove('hidden');
        showUsers();
    } else alert("❌ Wrong admin login");
}

// MANAGER LOGIN
function loginManager(){
    const user=document.getElementById('manager-user').value;
    const pass=document.getElementById('manager-pass').value;

    if(user===accounts.manager.user && pass===accounts.manager.pass){
        hideAllPanels();
        document.getElementById('manager-panel').classList.remove('hidden');
    } else alert("❌ Wrong manager login");
}

// HIDE EVERYTHING
function hideAllPanels(){
    document.getElementById('player-login').classList.add('hidden');
    document.getElementById('admin-manager-login').classList.add('hidden');
    document.getElementById('player-dashboard').classList.add('hidden');
    document.getElementById('admin-panel').classList.add('hidden');
    document.getElementById('manager-panel').classList.add('hidden');
    document.getElementById('quiz').classList.add('hidden');
    document.getElementById('result').classList.add('hidden');
}

// LOGOUT
function logoutPlayer(){ hideAllPanels(); document.getElementById('player-login').classList.remove('hidden'); document.getElementById('admin-toggle').classList.remove('hidden'); currentPlayer=null; }
function logoutAdmin(){ hideAllPanels(); document.getElementById('player-login').classList.remove('hidden'); document.getElementById('admin-toggle').classList.remove('hidden'); }
function logoutManager(){ hideAllPanels(); document.getElementById('player-login').classList.remove('hidden'); document.getElementById('admin-toggle').classList.remove('hidden'); }

// SHOW USERS
function showUsers(){
    const list=document.getElementById('user-list'); list.innerHTML="";
    players.forEach(p=>{
        const li=document.createElement('li');
        li.innerHTML=`<img src="${p.avatar}" width="30" style="border-radius:50%;"> ${p.name} | Score: ${p.score}`;
        list.appendChild(li);
    });
}

// START QUIZ
function startQuiz(){
    hideAllPanels();
    document.getElementById('quiz').classList.remove('hidden');
    document.getElementById('bg-music').play();

    category=currentPlayer.category;
    index=0; score=0; level=1;
    currentQuestions=database[category]["level"+level];
    document.getElementById('player-avatar').src=currentPlayer.avatar;
    showQ();
}

// SHOW QUESTION
function showQ(){
    let q=currentQuestions[index];
    document.getElementById('question').innerText=q.q;
    document.getElementById('level').innerText=`Level ${level}`;
    const div=document.getElementById('choices'); div.innerHTML="";
    document.getElementById('feedback').innerText="";
    q.choices.forEach(choice=>{
        const btn=document.createElement('button'); btn.innerText=choice;
        btn.onclick=()=>check(choice,btn); div.appendChild(btn);
    });
}

// CHECK ANSWER
function check(choice,btn){
    let correct=currentQuestions[index].a;
    if(choice===correct){
        btn.classList.add('correct'); score++; currentPlayer.score++;
        document.getElementById('feedback').innerText="✅ Correct!";
        document.getElementById('dashboard-score').innerText=`Score: ${currentPlayer.score}`;
    } else { btn.classList.add('wrong'); document.getElementById('feedback').innerText="❌ Wrong!"; }
    setTimeout(()=>{
        index++; if(index<currentQuestions.length) showQ(); else finish();
    },1000);
}

// FINISH QUIZ
function finish(){ hideAllPanels(); document.getElementById('result').classList.remove('hidden'); document.getElementById('score').innerText=`Score: ${score} (All done!)`; }

// GO BACK TO DASHBOARD
function goBack(){ hideAllPanels(); document.getElementById('player-dashboard').classList.remove('hidden'); }