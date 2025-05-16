#!/usr/bin/env node

// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* eslint-disable no-console, @typescript-eslint/no-var-requires */

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const ArgumentParser = require('argparse').ArgumentParser;
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
import SlideGenerator from './slide_generator';
const opener = require('opener');

const SCOPES = [
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/drive',
];

const USER_HOME =
  process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
const STORED_CREDENTIALS_PATH = path.join(
  USER_HOME,
  '.md2googleslides',
  'credentials.json'
);

const parser = new ArgumentParser({
  add_help: true,
  description: 'Markdown to Slides converter',
});

parser.add_argument(
  '-f',
  '--file',
  {
    help: 'Path to markdown file to convert',
    required: true,
  },
);

parser.add_argument(
  '-u',
  '--user',
  {
    help: 'Email address of user',
    required: false,
    dest: 'user',
    default: 'default',
  },
);
parser.add_argument(
  '-a',
  '--append',
  {
    dest: 'id',
    help: 'Appends slides to an existing presentation',
    required: false,
  },
);
parser.add_argument(
  '-e',
  '--erase',
  {
    dest: 'erase',
    action: 'store_true',
    help: 'Erase existing slides prior to appending.',
    required: false,
  },
);
parser.add_argument(
  '-n',
  '--no-browser',
  {
    action: 'store_true',
    dest: 'headless',
    help: 'Headless mode - do not launch browsers, just shows URLs',
    required: false,
  },
);
parser.add_argument(
  '-s',
  '--style',
  {
    help: 'Name of highlight.js theme for code formatting',
    dest: 'style',
    required: false,
    default: 'default',
  },
);
parser.add_argument(
  '-t',
  '--title',
  {
    help: 'Title of the presentation',
    dest: 'title',
    required: false,
  },
);
parser.add_argument(
  '-c',
  '--copy',
  {
    help: 'Id of the presentation to copy and use as a base',
    dest: 'copy',
    required: false,
  },
);

parser.add_argument(
  '--client_id',
  {
    help: 'Path to client credentials file',
    dest: 'client_id',
    required: false,
    default: path.join(USER_HOME, '.md2googleslides', 'client_id.json'),
  },
);

const args = parser.parse_args();

const STORED_CLIENT_ID_PATH = args.client_id;

function handleError(err) {
  console.log('Unable to generate slides:', err);
}

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fsp.readFile(STORED_CREDENTIALS_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fsp.readFile(STORED_CLIENT_ID_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  const baseDir = path.dirname(STORED_CREDENTIALS_PATH);
  try {
    await fsp.exists(baseDir);
  } catch (err) {
    await fsp.mkdir(baseDir);
  }
  await fsp.writeFile(STORED_CREDENTIALS_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: STORED_CLIENT_ID_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

function buildSlideGenerator(oauth2Client) {
  const title = args.title || args.file;
  const presentationId = args.id;
  const copyId = args.copy;

  if (presentationId) {
    return SlideGenerator.forPresentation(oauth2Client, presentationId);
  } else if (copyId) {
    return SlideGenerator.copyPresentation(oauth2Client, title, copyId);
  } else {
    return SlideGenerator.newPresentation(oauth2Client, title);
  }
}

function eraseIfNeeded(slideGenerator) {
  if (args.erase || !args.id) {
    return slideGenerator.erase().then(() => {
      return slideGenerator;
    });
  } else {
    return Promise.resolve(slideGenerator);
  }
}

function loadCss(theme) {
  const cssPath = path.join(
    require.resolve('highlight.js'),
    '..',
    '..',
    'styles',
    theme + '.css'
  );
  const css = fs.readFileSync(cssPath, {encoding: 'UTF-8'});
  return css;
}

function generateSlides(slideGenerator) {
  let source;
  if (args.file) {
    source = path.resolve(args.file);
    // Set working directory relative to markdown file
    process.chdir(path.dirname(source));
  } else {
    source = 0;
  }
  const input = fs.readFileSync(source, {encoding: 'UTF-8'});
  const css = loadCss(args.style);

  return slideGenerator.generateFromMarkdown(input, {
    css: css,
    useFileio: args.useFileio,
  });
}

function displayResults(id) {
  const url = 'https://docs.google.com/presentation/d/' + id;
  if (args.headless) {
    console.log('View your presentation at: %s', url);
  } else {
    console.log('Opening your presentation (%s)', url);
    opener(url);
  }
}

authorize()
  .then(buildSlideGenerator)
  .then(eraseIfNeeded)
  .then(generateSlides)
  .then(displayResults)
  .catch(handleError);
