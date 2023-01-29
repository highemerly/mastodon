import { autoPlayGif } from '../../initial_state';
import unicodeMapping from './emoji_unicode_mapping_light';
import { assetHost } from 'mastodon/utils/config';
import Trie from 'substring-trie';

const trie = new Trie(Object.keys(unicodeMapping));

// Convert to file names from emojis. (For different variation selector emojis)
const emojiFilenames = (emojis) => {
  return emojis.map(v => unicodeMapping[v].filename);
};

// Emoji requiring extra borders depending on theme
const darkEmoji = emojiFilenames(['🎱', '🐜', '⚫', '🖤', '⬛', '◼️', '◾', '◼️', '✒️', '▪️', '💣', '🎳', '📷', '📸', '♣️', '🕶️', '✴️', '🔌', '💂‍♀️', '📽️', '🍳', '🦍', '💂', '🔪', '🕳️', '🕹️', '🕋', '🖊️', '🖋️', '💂‍♂️', '🎤', '🎓', '🎥', '🎼', '♠️', '🎩', '🦃', '📼', '📹', '🎮', '🐃', '🏴', '🐞', '🕺', '📱', '📲', '🚲']);
const lightEmoji = emojiFilenames(['👽', '⚾', '🐔', '☁️', '💨', '🕊️', '👀', '🍥', '👻', '🐐', '❕', '❔', '⛸️', '🌩️', '🔊', '🔇', '📃', '🌧️', '🐏', '🍚', '🍙', '🐓', '🐑', '💀', '☠️', '🌨️', '🔉', '🔈', '💬', '💭', '🏐', '🏳️', '⚪', '⬜', '◽', '◻️', '▫️']);

const emojiFilename = (filename) => {
  const borderedEmoji = (document.body && document.body.classList.contains('theme-mastodon-light')) ? lightEmoji : darkEmoji;
  return borderedEmoji.includes(filename) ? (filename + '_border') : filename;
};

const emojifyTextNode = (node, customEmojis, natural) => {
  let str = node.textContent;
  let contentNaturalFlag = natural;
  let contentEmojiFlag = false;

  const fragment = new DocumentFragment();

  for (;;) {
    let match, i = 0;

    if (customEmojis === null) {
      while (i < str.length && !(match = trie.search(str.slice(i)))) {
        contentNaturalFlag = true;
        i += str.codePointAt(i) < 65536 ? 1 : 2;
      }
    } else {
      while (i < str.length && str[i] !== ':' && !(match = trie.search(str.slice(i)))) {
        contentNaturalFlag = true;
        i += str.codePointAt(i) < 65536 ? 1 : 2;
      }
    }

    let rend, replacement = null;
    if (i === str.length) {
      break;
    } else if (str[i] === ':') {
      if (!(() => {
        rend = str.indexOf(':', i + 1) + 1;
        if (!rend) return false; // no pair of ':'
        const shortname = str.slice(i, rend);
        // now got a replacee as ':shortname:'
        // if you want additional emoji handler, add statements below which set replacement and return true.
        if (shortname in customEmojis) {
          const filename = autoPlayGif ? customEmojis[shortname].url : customEmojis[shortname].static_url;
          const classname = contentEmojiFlag ? 'emojione custom-emoji' : 'emojione custom-emoji handon-emojione-first';
          contentEmojiFlag = true;
          replacement = document.createElement('img');
          replacement.setAttribute('draggable', false);
          replacement.setAttribute('class', classname);
          replacement.setAttribute('alt', shortname);
          replacement.setAttribute('title', shortname);
          replacement.setAttribute('src', filename);
          replacement.setAttribute('data-original', customEmojis[shortname].url);
          replacement.setAttribute('data-static', customEmojis[shortname].static_url);
          return true;
        }
        return false;
      })()) rend = ++i;
    } else { // matched to unicode emoji
      const { filename, shortCode } = unicodeMapping[match];
      const title = shortCode ? `:${shortCode}:` : '';
      replacement = document.createElement('img');
      replacement.setAttribute('draggable', false);
      replacement.setAttribute('class', 'emojione');
      replacement.setAttribute('alt', match);
      replacement.setAttribute('title', title);
      replacement.setAttribute('src', `${assetHost}/emoji/${emojiFilename(filename)}.svg`);
      rend = i + match.length;
      // If the matched character was followed by VS15 (for selecting text presentation), skip it.
      if (str.codePointAt(rend) === 65038) {
        rend += 1;
      }
    }

    fragment.append(document.createTextNode(str.slice(0, i)));
    if (replacement) {
      fragment.append(replacement);
    }
    str = str.slice(rend);
  }

  fragment.append(document.createTextNode(str));
  node.parentElement.replaceChild(fragment, node);
  return contentNaturalFlag;
};

const emojifyNode = (node, customEmojis, contentNaturalFlag) => {
  for (const child of node.childNodes) {
    switch(child.nodeType) {
    case Node.TEXT_NODE:
      contentNaturalFlag = emojifyTextNode(child, customEmojis, contentNaturalFlag);
      break;
    case Node.ELEMENT_NODE:
      if (!child.classList.contains('invisible'))
        contentNaturalFlag = emojifyNode(child, customEmojis, contentNaturalFlag);
      break;
    }
  }
  return contentNaturalFlag;
};

const emojify = (str, customEmojis = {}) => {
  let contentNatural;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = str;

  if (!Object.keys(customEmojis).length)
    customEmojis = null;

  contentNatural = emojifyNode(wrapper, customEmojis, false);

  if (!contentNatural) {
    wrapper.innerHTML = '<span class="handon-emoji-only-content">' + wrapper.innerHTML + '</span>';
  }

  return wrapper.innerHTML;
};

export default emojify;

export const buildCustomEmojis = (customEmojis) => {
  const emojis = [];

  customEmojis.forEach(emoji => {
    const shortcode = emoji.get('shortcode');
    const url       = autoPlayGif ? emoji.get('url') : emoji.get('static_url');
    const name      = shortcode.replace(':', '');

    emojis.push({
      id: name,
      name,
      short_names: [name],
      text: '',
      emoticons: [],
      keywords: [name],
      imageUrl: url,
      custom: true,
      customCategory: emoji.get('category'),
    });
  });

  return emojis;
};

export const categoriesFromEmojis = customEmojis => customEmojis.reduce((set, emoji) => set.add(emoji.get('category') ? `custom-${emoji.get('category')}` : 'custom'), new Set(['custom']));
