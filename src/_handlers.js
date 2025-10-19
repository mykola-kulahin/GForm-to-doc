const HANDLERS = {
  copy: {
    'SLIDES': (templateFile, newName, parentFolder) => {
      return templateFile.makeCopy(newName, parentFolder);
    },
    'DOCS': (templateFile, newName, parentFolder) => {
      // Логіка копіювання для Google Docs ідентична
      return templateFile.makeCopy(newName, parentFolder);
    }
  },
  fill: {
    'SLIDES': (fileId, replacements) => {
      const presentation = SlidesApp.openById(fileId);
      for (const placeholder in replacements) {
        presentation.replaceAllText(placeholder, replacements[placeholder]);
      }
    },
    'DOCS': (fileId, replacements) => {
      const doc = DocumentApp.openById(fileId);
      const body = doc.getBody();
      for (const placeholder in replacements) {
        body.replaceText(placeholder, replacements[placeholder]);
      }
    }
  }
};