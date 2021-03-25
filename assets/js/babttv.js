/* global $ JSZip Pickr svgAsPngUri saveAs */

let pickerColour;
let pickr;
let lastLayerColour;

const titleCase = (s) => s[0].toUpperCase() + s.slice(1);

const getLayerName = () => $('#layer-name-button').text().toLowerCase();
const getEmoteName = (forceEmoteName) => (forceEmoteName || $('#emote-name').text()).toLowerCase();
const getSVGOfEmote = (emoteName) => $(`[id^="variant-${emoteName}"]`).parents('svg');

const getLayerColour = (forceColour) => $(`[id$="-svg"]:visible .${forceColour || getLayerName()}`).css('fill');

const getEmoteNames = () => [...new Set($('[id^="variant-"]').map((i, e) => $(e).attr('id').replace('variant-', '').replace(/--inject-.*/, '')))];

const getLayers = (emoteName) => {
    const layers = new Set();
    getSVGOfEmote(emoteName).find('.coloured').map((i, e) => {
        const classes = $(e).attr('class').split(/\s+/).filter((x) => x !== 'coloured');
        layers.add(...classes);
    });
    return [...layers];
};

const getHairTypes = (emoteName) => {
    return ['none', ...new Set(getSVGOfEmote(emoteName).find(`[id*="${emoteName}"] [id^="core-hair-"]`).map((i, e) => $(e).attr('id').replace(/--inject-.*/, '').replace('core-hair-', '')))];
};


const setupOptions = (container, options, f) => {
    $(`#${container} li`).remove();
    const [first] = options;
    $(`#${container}-button`).text(titleCase(first));
    for(const option of options) {
        $(`#${container}`).append(`<li><button id="${container}-${option}-btn" class="dropdown-item" type="button">${titleCase(option)}</button></li>`);
        $(`#${container}-${option}-btn`).on('click', () => {
            $(`#${container}-button`).text(titleCase(option));
            (f || (() => {}))(option);
        })
    }
};

const setLayerColour = (forceColour) => pickr.setColor(getLayerColour(forceColour));

const svgList = ['peeporecon', 'ge', 'hypers', 'ppl', 'monkas', 'dankthink', 'peeposhy'];

let pageNumber = 1;

const showHair = (hairType) => {
    $('[id^="core-hair"]').hide();
    $(`[id^="core-hair-${hairType}"]`).show();
};

const showEmote = (emoteNameForce) => {
    const emoteName = getEmoteName(emoteNameForce);
    if(emoteName) {
        $('[id^="variant"]').hide();
        $('[id^="variant"]').parents('svg').hide();
        showHair();
        $(`[id^="variant-${emoteName}"]`).show();
        getSVGOfEmote(emoteName).show();
    }
};

// !------------------------------------------------------------------------------------------
const updatePage = () => {
    $('[id^="page-btn-"]').show();
    if(pageNumber >= $('#emote-grid').find('img').length / 16) {
        $('#page-btn-forward').hide();
    }
    if(pageNumber <= 1) { $('#page-btn-back').hide(); }
    $('#page-number').text(`Page ${pageNumber}`);
};

const showOverviewPage = (page) => {
    updatePage();
    $('#emote-grid img').hide();
    $('#emote-grid img').slice((page - 1) * 16, page * 16).show();
};

const goBackPage = () => showOverviewPage(--pageNumber);
const goForwardPage = () => showOverviewPage(++pageNumber);


const showOverview = async() => {
    await addAllToOverview();
    showOverviewPage(pageNumber);
    $('.overview').css({'z-index': 2});
};

const hideOverview = (emoteName) => () => {
    $('#emote-name').text(titleCase(emoteName));
    setEmoteLayers(emoteName); // ? <-------------------
    $('.overview').css({'z-index': -2});
};

const addToOverview = async(emoteName) => {
    const emote = $(`[id^="variant-${emoteName}"]`);
    const id = emote.parents('svg').attr('id');
    const uri = await svgAsPngUri(document.getElementById(id), {scale:1.5, excludeUnusedCss: true});
    $('#emote-grid').append(`<img width="140px" src="${uri}" id="emote-overview-${emoteName}" style="display:none" class="breathing"/>`);
    $(`#emote-overview-${emoteName}`).on('click', hideOverview(emoteName));
};

const addAllToOverview = async() => {
    const oldEmote = getEmoteName();
    $('#emote-wrapper').hide();
    $('#emote-grid img').remove();
    for(const emoteName of getEmoteNames()) {
        showEmote(emoteName);
        await addToOverview(emoteName);
    }
    showEmote(oldEmote);
    $('#emote-wrapper').show();
};

// !------------------------------------------------------------------------------------------


const setEmoteLayers = (emoteNameForce) => {
    const emoteName = getEmoteName(emoteNameForce);
    showEmote(emoteName);
    pickerColour = undefined;
    setupOptions('layer-name', getLayers(emoteName), setLayerColour);
    setupOptions('hair-type', getHairTypes(emoteName), showHair);
    setupOptions('emote-scale', ['all', 'bttv', 'twitch']);
    setTimeout(setLayerColour, 100);
};

const colourLayerIn = () => {
    if(typeof pickerColour === 'undefined') { return; }
    $(`svg .${getLayerName()}`).css({fill: `#${typeof pickerColour === 'string' ? pickerColour : pickerColour.toHEXA().join('')}`});
};

const getEmoteSizes = () => {
    switch($('#emote-scale-button').text().toLowerCase()) {
        case 'all': return [112, 4096];
        case 'twitch': return [4096];
        case 'bttv': return [112];
        default: return [];
    }
};

const downloadEmotes = async() => {
    const emoteSizes = getEmoteSizes();
    const zip = new JSZip();
    const oldEmote = getEmoteName();
    const emoteNames = getEmoteNames();
    $('#emote-wrapper').hide();
    let j = 0;
    for(const emoteName of emoteNames) {
        showEmote(emoteName);
        const emote = $(`[id^="variant-${emoteName}"]`);
        const id = emote.parents('svg').attr('id');
        for(const size of emoteSizes) {
            const uri = await svgAsPngUri(document.getElementById(id), {scale: size/112})
            const idx = uri.indexOf('base64,') + 'base64,'.length;
            const content = uri.substring(idx);
            zip.file(`${size}/${emoteName}.png`, content, {base64: true});
        }
        j++;
        $('#progress-image-cover').css({height: `${200 - (200 * (j / emoteNames.length))}px`});
    }
    showEmote(oldEmote);
    $('#emote-wrapper').show();
    zip.generateAsync({type: 'blob'}).then((content) => {
        saveAs(content, 'emotes.zip');
    });
};

window.onload = () => {
    const el = document.querySelector('#picker');
    pickr = Pickr.create({
        comparison: true,
        components: {hue: true, interaction: {input: true, save: true}},
        el,
        theme: 'classic'
    });
    pickr.on('init', () => { setTimeout(setLayerColour, 1000); });
    pickr.on('hide', () => { pickerColour = lastLayerColour; pickr.setColor(lastLayerColour); lastLayerColour = undefined; });
    pickr.on('show', () => { lastLayerColour = getLayerColour(); });
    pickr.on('save', (color) => { lastLayerColour = `#${color.toHEXA().join('')}`; pickerColour = undefined; });
    pickr.on('change', (color) => { pickerColour = color; });

    const img = (name) => `<img id="${name}-svg" src="/assets/svg/${name}.svg" onload="SVGInject(this)" style="display:none" height="50vh" width="auto" />`;
    $('#emote-wrapper').prepend(...svgList.map(img));

    const init = () => {
        $('#emote-name').text(titleCase(getEmoteNames()[0]));
        setEmoteLayers();
    };

    setInterval(colourLayerIn, 100);
    setTimeout(init, 500);

    $('#overview-link').on('click', showOverview);
    $('#hair-type').on('change', showHair);
    $('#download-link').on('click', downloadEmotes);
    $('#page-forward').on('click', goForwardPage);
    $('#page-back').on('click', goBackPage);
};
