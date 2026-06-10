import { useBranding } from "../../public-site/branding.runtime";
import { Link } from "react-router-dom";

export default function PublicSiteFooter() {
  const branding = useBranding();

  return (
    <>
      <footer className="site-footer">
              <div className="max-w-[1440px] mx-auto">
                  <div className="footer-grid">
                      <div className="flex flex-col gap-6">
                          <div className="footer-card p-2">
                              <img
                                  alt={`${branding.fullName} Footer`}
                                  className="w-full h-auto rounded-xl object-contain"
                                  src="/images/footer.webp"
                              />
                          </div>
                          <div className="flex gap-4">
                              <a className="social-link" href="#">
                                  <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                      <path clipRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fillRule="evenodd"></path>
                                  </svg>
                              </a>
                              <a className="social-link" href="#">
                                  <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                      <path clipRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.468 2.373c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" fillRule="evenodd"></path>
                                  </svg>
                              </a>
                          </div>
                      </div>
                      <div className="flex flex-col gap-4">
                          <h4 className="text-white text-lg font-bold">Contato</h4>
                          <ul className="text-gray-400 space-y-3">
                              <li className="flex items-start gap-3">
                                  <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                                  <span>Unidade Parque da Cidade
                                      Av. das Nações Unidas, 14401 - Torre Tarumã (Conj. 804) - Chácara Santo Antônio, SP -
                                      04794-000</span>
                              </li>
                              <li className="flex items-start gap-3">
                                  <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                                  <span>Unidade Birmann 20
                                      Av. das Nações Unidas, 17891 - Jardim Dom Bosco, SP - 04723-002</span>
                              </li>
                              <li className="flex items-center gap-3">
                                  <span className="material-symbols-outlined text-primary text-xl">call</span>
                                  <span>+55 11 97893-5812</span>
                              </li>
                              <li className="flex items-center gap-3">
                                  <span className="material-symbols-outlined text-primary text-xl">mail</span>
                                  <span>concierge@@jlrbeautyhouse.com.br</span>
                              </li>
                          </ul>
                      </div>
                      <div className="flex flex-col gap-4">
                          <h4 className="text-white text-lg font-bold">V O C Ê  É O PROJETO MAIS
                          </h4>
                          <h4 className="text-primary text-lg font-bold"> IMPORTANTE DA SUA VIDA!
                          </h4>
                          <ul className="text-gray-400 space-y-3">
                              <li className="flex justify-between">
                                  <span></span>
                                  <span className="text-white">Autocuidado</span>
                              </li>
                              <li className="flex justify-between">
                                  <span></span>
                                  <span className="text-white">Transformação</span>
                              </li>
                              <li className="flex justify-between">
                                  <span></span>
                                  <span className="text-white">Inovação</span>
                              </li>
                          </ul>
                      </div>
                      <div className="flex flex-col gap-4" id="contact">
                          <h4 className="text-white text-lg font-bold">Horários
                          </h4>
                          <ul className="text-gray-400 space-y-3">
                              <li className="flex justify-between">
                                  <span>Seg - Sex</span>
                                  <span className="text-white">9:00 AM - 8:00
                                      PM</span>
                              </li>
                              <li className="flex justify-between">
                                  <span>Sábado</span>
                                  <span className="text-white">10:00 AM - 6:00
                                      PM</span>
                              </li>
                              <li className="flex justify-between">
                                  <span>Domingo</span>
                                  <span className="text-white">Fechado</span>
                              </li>
                          </ul>
                          <div className="footer-card">
                              <h4 className="text-forest text-lg font-bold">Entre
                                  na Lista de Convidados</h4>
                              <p className="footer-muted">Receba ofertas exclusivas e
                                  conteúdos de beleza.</p>
                              <form className="flex flex-col gap-3 mt-2">
                                  <input className="footer-input" placeholder="Endereço de e-mail" type="email" />
                                  <p className="footer-muted text-xs">
                                      {`Ao assinar, você concorda em receber comunicações da ${branding.fullName} e aceita nossa `}
                                      <a className="footer-link" href="#">Política de Privacidade</a>.
                                  </p>
                                  <button className="footer-submit">
                                      Assinar
                                  </button>
                              </form>
                          </div>
                      </div>
                  </div>
                  <div className="footer-bottom">
                      <p className="text-gray-500 text-sm">{`(c) 2024 ${branding.fullName} Salão & Spa. Todos os direitos reservados.`}</p>
                      <div className="flex gap-6">
                          <a className="footer-link" href="#">Política de
                              Privacidade</a>
                          <Link className="footer-link" to="/admin">Administrador</Link>
                      </div>
                  </div>
              </div>
          </footer>
    </>
  );
}

