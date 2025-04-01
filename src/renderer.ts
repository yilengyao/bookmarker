const { shell } = require('electron');

const parser: DOMParser = new DOMParser();

const linksSection: HTMLElement | null = document.querySelector('.links');
const errorMessage: HTMLDivElement | null = document.querySelector('.error-message');
const newLinkForm: HTMLFormElement | null = document.querySelector('.new-link-form');
const newLinkUrl: HTMLInputElement | null = document.querySelector('.new-link-url');
const newLinkSubmit: HTMLInputElement | null = document.querySelector('.new-link-submit');
const clearStorageButton: HTMLButtonElement | null = document.querySelector('.clear-storage');

newLinkUrl?.addEventListener('keyup', () => {
    if (newLinkSubmit) {
        newLinkSubmit.disabled = !newLinkUrl.value;
    }
});

newLinkForm?.addEventListener('submit', (event: Event) => {
    event.preventDefault();

    const url: string | undefined = newLinkUrl?.value;

    if (!url) {
        return;
    }

    fetch(url)
            .then((response: Response) => response.text())
            .then(parseResponse)
            .then(findTitle)
            .then((title: string) => storeLink(title, url))
            .then(clearForm)
            .then(renderLinks)
            .catch(errorMessage => handleError(errorMessage, url)); 
});

clearStorageButton?.addEventListener('click', () => {
    localStorage.clear();
    if (linksSection) {
        linksSection.innerHTML = '';
    }
});

linksSection?.addEventListener('click', (event: Event) => {
    const target = event.target as HTMLElement;
    if (target instanceof HTMLAnchorElement && target.href) {
        event.preventDefault();
        shell.openExternal(target.href);
    }
});

const clearForm = (): void => {
    if (newLinkUrl) {
        newLinkUrl.value = "";
    }
}

const parseResponse = (text: string): Document => {
    return parser.parseFromString(text, 'text/html');
};

const findTitle = (nodes: Document): string => {
    const titleElement = nodes.querySelector('title');
    if (!titleElement) {
        throw new Error('No title found in the document');
    }
    return titleElement.innerText;
}

const storeLink = (title: string, url: string): void => {
    localStorage.setItem(url, JSON.stringify({ title: title, url: url}));
}

interface StoredLink {
    title: string;
    url: string;
}

const getLinks = (): StoredLink[] => {
    return Object.keys(localStorage)
                 .map((key: string) => {
                    try {
                         const item: any = JSON.parse(localStorage.getItem(key) || '');
                         return (item && typeof item === 'object') ? (item as StoredLink) : null;
                    } catch {
                        return null;
                    }
                 })
                 .filter((item): item is StoredLink => item !== null);            
}

const convertToElement = (link: StoredLink): string => {
    return `<div class="link"><h3>${link.title}</h3>
            <p><a href="${link.url}">${link.url}</a></p>`
}

const renderLinks = (): void => {
    const linkElements: string = getLinks().map(convertToElement).join('');
    if (linksSection) {
        linksSection.innerHTML = linkElements;
    }
}

const handleError = (error: Error, url: string): void => {
    if (errorMessage) {
        errorMessage.innerHTML = `
        There was an issue adding "${url}": ${error.message}
        `.trim();
    }
    setTimeout(() => {
        if (errorMessage) errorMessage.innerText = '';
    }, 5000);
}

const validateResponse = (response: Response): Response => {
    if (response.ok) { return response; }
    throw new Error(`Status code of ${response.status} ${response.statusText}`);
}

renderLinks();