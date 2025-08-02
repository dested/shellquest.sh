TUI Crawler
====


# Overview

We are building a terminal based procedurally generated dungeon crawler named tui crawler. it is for engineers to play something while they are bored or waiting for ai or compiling. each dungeon level is very short, just enough time to be fun and challenging.

A player will run `bunx tui-crawler` or `npx tui-crawler` and it will install the package and immediately start the game.

# Non game screens

Once the user starts the bunx app it will show them the opening window with the logo.

if its their first time It will ask them what their username is, check if its taken, validate offensiveness, and if not then ask them for a password to create their account and save their progress.

A player will see their list of characters on their profile. They can also create a new one

When creating a new one they will type their name (we will validate its not offensive).

They will then select their class, either wizard or wizard. Wizards can use wands and swords. Fighters can use axes and swords.

After they select their character they can see stats about it:

What level they are

How much experience they have

Their current weapon (their main and their swap, thats all they can carry)

They can also see play details, how many dungeons theyve beaten of each type.

They can also see their spot in the ladder

They will also ahve the ability to put some stuff on their clipboard so they can share their stats on social media like wordle did

# App

the app itself is using an engine called OpenTUI. it has a full pixel renderer for the game, as well as a window and input system so we can build the other screens. It is a bun typescript app. very safe.

## Game engine

you are on a tile based grid, but you can move sub pixels inside that grid. You will collide wiht walls. Make sure before you move you do the wall check before the subpixel movement so you dont clip into walls. There are 4 layers, bottom, sprite, particles, and overlay for effect. The player and enemies are on the sprite layer.

## Effects

There will need to be a particle effect system. like when you swing, or magic, or get hit. also shaking the screen a few pixels is really important.

## SFX

We want to use the sound effects that the node console already provides us with. nothing high def. also the user must be able to mute it in the menu

# Player

Players have levels, experiecnce, and weapons. each player can only carry two weapons, a main and a swap.

They move with arrows or wasd, swing with space, run with shift, and swap with tab

experience is gotten from beating enemies and also completing dungeons. the more time left at the end of the dungeon the more experience you get.  each level is progressively harder to get. Also the dungeon generation difficulty will scale based on the level of the player

# Player progression

You start off with a basic weapon for your class that does 1 damage. you also have 5hp and 5 mana.

Each level allows you to drop stronger weapons, and every 5 levels you get +1 hp.

You also have a run meter which runs out quickly based on your level. more level more run etc.

# weapons

There are 5 types of swords, 5 wands, and 5 axes.

swords and axes have enchantments like swing faster, extra damage, idk stuff like that. i havent thought this through.

wands can do mele damage but its weak, they have spell damage like shooting fireballs shooting ice, idk stuff like that.

weapons can also have buffs like +10% speed, etc etc.

the higher the weapon level the more damage it does, etc.

# Dungeon generation

3 types of dungeons the user can play, a 30second 60 second and 120 second.

there is one door in the dungeon

once the time runs out you fail the dungeon, you cannot start over, you must do a new level

Every dungeon has keys. 30 second dungeons have 3 keys, 60 have 5, and 120 have 8. Your goal is to collect all the keys and make it out of the dungeon before the timer

Each dungeon has the ability to generate 1 or 2 items for your current class

There are also a set number of coins throughout (5 for 30 second, 10 for 60 and 20 for 120). Coins also increase your experience level.

You start off with full mana and health but no pots. each dungeon will have 2 pots of each placed randomly. you can only hold one at a time.

Each dungeon also has enemies randomly placed throughout with varying amounts of health. It should take 1 to 4 hits typically to defeat them

Each dungeon will be procedurally generated and verified to be passable on the server. it will then be hashed and shipped to the player

## Procedural

You will need to devise a way to generate interesting and beatable levels

We are using the library rot-js to do a lot of the heavy lifting, but it will still need to be good.

# Verifiability

Once the user starts the dungeon it will get its latest player data, and the dungeon itself. it will then record out every keypress while its playing. At the end it will ship those keypresses to the server so it can verify that there was no cheating. each levle must be played fully. that means that generation and playthrough must be 100% deterministic, with random seeds and such. Once its verfied the user gets credit and their ladder and player details are updated.

The game engine will run at 10fps, but the renderer is as fast as the ui can be.

We will only store the arrow keys, the space bar (spacebar is swing), and shift (which is run but has a limit)

# Ladder/leaderboard

The point of the game is to climb the ladder. The ladder will show the highest level players, and where you are ranked.

There are multiple ladders that you are on, all that reset at different intervals.

1. last hour
2. last day
3. this week (monday to sunday)
4. this month (1st to end of the month)

This is the reason they are playing the game. to compete and climb the ladder

# API

trpc node express based

user management

level generation

level verification

level replay

ladder details

etc

# Website

There will also need to be an accompanying website (react typescript tailwind shadcn etc) that will show some landing page details about the game with screenshots, explain how it works, have a character viewer (https://tui-crawler.com/u/user-name) and the ladder viewer.

Both in the game and the website you can replay any level that was played from start to finish with like a scrubber style visualization. you like to the game https://tui-crawler.com/g/game-id and you see it from start to finish.

Both the game and the website need a donate button that just links to a stripe page
