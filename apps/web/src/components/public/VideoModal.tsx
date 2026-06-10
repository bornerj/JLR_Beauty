export default function VideoModal() {
  return (
    <>
      <div className="fixed inset-0 z-[70] hidden items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300" id="video-modal">
          <div className="absolute inset-0" id="video-backdrop"></div>
          <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gold/60">
              <button className="absolute top-3 right-3 text-gray-500 hover:text-forest transition-colors z-10 bg-white/90 rounded-full p-1" id="close-video" type="button">
                  <span className="material-symbols-outlined">close</span>
              </button>
              <div className="aspect-video bg-black">
                  <video id="video-player" className="w-full h-full" controls autoPlay playsInline>
                      <source src="" type="video/mp4" />
                  </video>
              </div>
          </div>
      </div>
    </>
  );
}
