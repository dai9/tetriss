# Tetriss
A JavaScript implementation of Tetris.

Please contact me if you find a bug or have suggestions. Thanks!

## Motivation
I created Tetriss for my first project at Galvanize full-stack bootcamp after 5 weeks of studying JavaScript, HTML, and CSS. Still new to coding at the time, I wanted to challenge my understanding of OOP by trying to clone one of my favorite games from my childhood. Tetriss was initially a simple, front-end game that used Firebase to persist high scores across multiple sessions.

Since then, I've been slowly making changes to the game as I continue my studies at Galvanize. I plan to add a versus mode with Socket.IO to allow friends to play against each other in real time. After that, I would like to switch from Firebase to a Postgres database. These changes will come slowly as I am still finishing up my last few months at Galvanize.

## Screenshots
<img src="http://i.imgur.com/32UNdZs.png" alt="homepage screenshot" height=425 />
<img src="http://i.imgur.com/qYAmV7w.png" alt="gameplay screenshot" height=425 />

## Challenges
One of the biggest challenges with Tetriss was writing code that would allow me to add new features over time. Initially, with only one week to complete this project, I didn't spend enough time thinking about what I'd like to add to the project in the future. I took shortcuts, e.g. the Game class would have methods that would directly reference the instance's keys rather than receive the values through parameters. As a result, my code wasn't as modular. Had I written those methods so that I could pass arguments into them, I would have saved time later on when I wanted to reuse a method for a different purpose.

After months away from the project, it's been somewhat difficult to remember why I took certain approaches. I've grown a lot as a developer in my past four months at Galvanize, so I see little things in my code that I wouldn't do anymore. As time permits, I'll be able to spend more time refactoring.

## Technologies Used
- jQuery
- Firebase
- Socket.IO

## Features Added
- Versus mode
- Chat

## To Do
- Persist scores via Postgres instead of Firebase.
- Make rotating pieces when next to walls more friendly.
- Prevent quick piece setting at high gravity.

## Running the Game
Check out the game at http://tetriss.herokuapp.com
