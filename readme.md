# Tetriss
A JavaScript implementation of the classic puzzle game, Tetris.

Please send me a message if you find a bug or have suggestions. Thanks!

## Motivation
I created Tetriss for my first project at Galvanize bootcamp after 5 weeks of studying JavaScript, HTML, and CSS. Still fairly new to coding at the time, I wanted to challenge my understanding of OOP by trying to clone one of my favorite games growing up. Tetriss was initially a simple, front-end game that used Firebase to persist high scores across multiple sessions.

Since then, I've been slowly making changes to the game as I continue my studies at Galvanize. I plan to add a versus mode which will utilize Socket.IO to allow friends to play against each other in real time. After that, I would like to switch from Firebase to a Postgres database. These changes will come slowly as I am still finishing up my last few months at Galvanize.

## Screenshots
<img src="http://i.imgur.com/32UNdZs.png" alt="screenshot of homepage" height=400 />
<img src="http://i.imgur.com/qYAmV7w.png" alt="screenshot of solo mode" height=400 />

## Technologies
- jQuery
- Firebase
- Socket.IO (added)

## To Do
- Persist scores via Postgres instead of Firebase.
- Make rotating pieces when next to walls more friendly.
- Prevent quick piece setting at high gravity.

## Completed
- Versus mode

## Running the Game
Check out the game at http://tetriss.herokuapp.com
