# Gimkit Cheat

## Usage

When in a Gimkit game, open the console (Ctrl+Shift+I) and paste the code for your desired gamemode. Read below for more information for each gamemode.

## Gamemodes

Any gamemode specific script will pull up a hud to manage the script, which can be disabled by hitting shift 3 times.

### [General](/general.js)

To run the general script, a local override must be set up. See below for instructions on various browsers. If you are using a browser that doesn't support local overrides, you can use the [v1 version of this script](/v1/general.js), which requires you answering all questions once before it works.

Click [here](#setting-up-an-override) to see how to set up a local override.

Once run, it automatically answers questions every ~1 second.

### [Classic](/gamemodes/classic.js)

This should not be used in conjunction with the general script.

The trick for classic is loosely based around a trick found in [non-reai's Gimkit hack](https://github.com/non-reai/Gimkit-Hacks) to answer questions, rather than manually storing and answering questions. It automatically answers questions and purchases upgrades, and all you should manually do is purchase and use powerups.

### [Fishtopia](/gamemodes/fishtopia.js)

This should be used in conjunction with the general script.

Automatically answers questions, sells fish without being at the sell station, and allows you to fish without being at water. After using a "travel to..." thing (such as the travel to purple pond boat), you will be able to permanently use it from anywhere.

## Setting up an override

#### Tested browsers that support local overrides
Chrome and Edge

#### Tested browsers that do not support local overrides
Firefox

Overrides only work on certain browsers. If the browser you are using supports them, follow the following steps to set the one for Gimkit cheat up.

1. Open the console (Ctrl+Shift+I)
2. Click the "Sources" tab
3. On the left, open the "Overrides" tab
4. Hit "Select folder for overrides"
5. Select a folder to store the override in
6. If a "www.gimkit.com" subfolder does not exist, create one
7. Download [App.4382044d.js](/overrides/App.4382044d.js), and place it in the "www.gimkit.com" folder

Whenever you load the page, keep the console open until you see the "Gimkit Cheat Override Loaded" message.