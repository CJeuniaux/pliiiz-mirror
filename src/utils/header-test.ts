// TEST D'ACCEPTATION HEADER
// Ce fichier vérifie que le header global est présent sur les bonnes pages

// Test simple à exécuter dans la console du navigateur :
console.log('=== TEST HEADER PLIIIZ ===');

// Test 1: Vérifier la présence du header sur les pages protégées
const testHeaderPresence = () => {
  const header = document.querySelector('.app-header');
  const logo = document.querySelector('.app-header__logo');
  const tagline = document.querySelector('.app-header__tagline');
  
  if (header && logo && tagline) {
    console.log('✅ Header présent avec logo et tagline');
    console.log('   Tagline:', tagline.textContent);
    return true;
  } else {
    console.log('❌ Header manquant ou incomplet');
    console.log('   Header:', !!header);
    console.log('   Logo:', !!logo);
    console.log('   Tagline:', !!tagline);
    return false;
  }
};

// Test 2: Vérifier le style dégradé
const testHeaderStyle = () => {
  const header = document.querySelector('.app-header');
  if (header) {
    const styles = window.getComputedStyle(header);
    const background = styles.background || styles.backgroundImage;
    
    if (background.includes('linear-gradient') || background.includes('gradient')) {
      console.log('✅ Dégradé violet détecté');
      return true;
    } else {
      console.log('❌ Dégradé violet manquant');
      console.log('   Background actuel:', background);
      return false;
    }
  }
  return false;
};

// Test 3: Vérifier la position sticky
const testHeaderPosition = () => {
  const header = document.querySelector('.app-header');
  if (header) {
    const styles = window.getComputedStyle(header);
    const position = styles.position;
    const zIndex = styles.zIndex;
    
    if (position === 'sticky' && parseInt(zIndex) >= 50) {
      console.log('✅ Position sticky avec z-index correct');
      return true;
    } else {
      console.log('❌ Position incorrecte');
      console.log('   Position:', position);
      console.log('   Z-index:', zIndex);
      return false;
    }
  }
  return false;
};

// Exécuter tous les tests
const runHeaderTests = () => {
  console.log('Page actuelle:', window.location.pathname);
  
  const test1 = testHeaderPresence();
  const test2 = testHeaderStyle();
  const test3 = testHeaderPosition();
  
  const allPassed = test1 && test2 && test3;
  
  console.log('=== RÉSULTAT ===');
  console.log(allPassed ? '✅ Tous les tests passent' : '❌ Certains tests échouent');
  
  return allPassed;
};

// Exporter pour utilisation
if (typeof window !== 'undefined') {
  (window as any).testPliiizHeader = runHeaderTests;
  console.log('Pour tester le header, tapez: testPliiizHeader()');
}

export { runHeaderTests };