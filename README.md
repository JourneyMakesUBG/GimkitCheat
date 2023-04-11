# Gimkit Cheat

## Usage

When in a Gimkit game, open the console (Ctrl+Shift+I) and paste the code for your desired gamemode after setting up an override. Read below for more information for each gamemode.

## Gamemodes

Any gamemode specific script will pull up a hud to manage the script, which can be disabled by hitting shift 3 times.

### All scripts now require a local override to be set up. Click [here](#setting-up-the-overrides) to see how to set up a local override. If you are unable to use local overrides, you can use the [old version](/v1/general.js) that doesn't require an override. You will need to answer all questions once before it begins working.

### [General](/general.js)

This script automatically answers a question every ~1 second. Manually answering questions may cause them to be wrong even if they looked correct.

### [Classic](/gamemodes/classic.js)

This should not be used in conjunction with the general script.

The trick for classic is loosely based around a trick found in [non-reai's Gimkit hack](https://github.com/non-reai/Gimkit-Hacks) to answer questions, rather than manually storing and answering questions. It automatically answers questions and purchases upgrades, and all you should manually do is purchase and use powerups.

### [Fishtopia](/gamemodes/fishtopia.js)

This should be used in conjunction with the general script.

This script allows you to sell fish without being at the sell station and fish anywhere without being at water. Additionally, after using a "travel to..." thing (such as the travel to purple pond boat), you will be able to permanently use it from anywhere.

### [One Way Out](/gamemodes/one-way-out.js)

This should be used in conjunction with the general script.

For now, this script is pretty bare-bones. All it does is allow you to buy shield cans and medkits from anywhere. More features may be added in the future.

### [Farmchain](/gamemodes/farmchain.js)

This should be used in conjunction with the general script.

This script allows you to sell crops, get water, buy plants and harvest from anywhere. You need to harvest a plot once before it will be auto-harvested in the future.

## Setting up the overrides

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
7. Download [all files in the overrides folder](/overrides/), and place them in the "www.gimkit.com" folder
(in order to download a file, click "raw" at the top of the preview and then right click > "save as")

Whenever you load the page, keep the console open until you see the "Gimkit Cheat Override Loaded" message.

## Updating the override

In order to update the overrides, simply redownload [the overrides](/overrides/) and replace the old ones.