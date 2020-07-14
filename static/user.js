Array.from(document.getElementsByClassName('start-round')).forEach(element => {
  element.addEventListener('click', async (event) => {
    await fetch(`/user/${event.target.dataset.userId}/round/${event.target.dataset.roundId}/start`, {
      method: 'POST'
    });
    let loop;
    const windowFeatures = 'menubar=off,toolbar=off,location=off,left=0,top=0screenX=1,screenY=1';
    const popup = window.open(`${document.body.dataset.competitionUrl}/#${event.target.dataset.roundId}`, 'competition-ui', windowFeatures);
    popup.moveTo(0, 0);
    popup.resizeTo(screen.width, screen.height);

    loop = setInterval(() => {
      if (popup.closed) {
        clearInterval(loop);
        window.location.reload();
      }
    }, 1000);
    element.remove();
  });
});
