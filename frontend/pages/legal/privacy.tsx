import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0]">
      {/* Navigation */}
      <nav className="bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-[#00ff9d]">
            NeymaryShop
          </Link>
          <Link href="/catalog" className="text-gray-400 hover:text-[#e0e0e0]">
            ← В каталог
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-2">
          Политика конфиденциальности
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Защита персональных данных пользователей
        </p>

        <div className="prose prose-invert max-w-none">
          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-[#00ff9d] mb-4">
              1. Общие положения
            </h2>
            <div className="space-y-3 text-gray-300">
              <p>
                1.1. Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок сбора, 
                хранения, использования и защиты персональных данных пользователей интернет-магазина 
                NeymaryShop (далее — «Сайт» или «Продавец»).
              </p>
              <p>
                1.2. Владелец Сайта — Индивидуальный предприниматель Ионцев Константин Константинович 
                (далее — «Оператор персональных данных»).
              </p>
              <p>
                1.3. Акцептуя настоящую Политику, Пользователь выражает своё согласие на обработку 
                персональных данных на условиях, изложенных ниже.
              </p>
              <p>
                1.4. Оператор не передаёт персональные данные Пользователя третьим лицам, за исключением 
                случаев, предусмотренных законодательством РФ.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-[#00ff9d] mb-4">
              2. Сбор персональных данных
            </h2>
            <div className="space-y-3 text-gray-300">
              <p>
                2.1. Оператор собирает следующие категории персональных данных:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Контактные данные:</strong> адрес электронной почты (email)</li>
                <li><strong>Идентификаторы:</strong> username в Telegram (по желанию)</li>
                <li><strong>Платёжные данные:</strong> информация об оплате (обрабатывается платёжными системами)</li>
                <li><strong>Технические данные:</strong> IP-адрес, данные cookies, информация о браузере</li>
              </ul>
              <p>
                2.2. Сбор данных осуществляется исключительно в целях:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Оформления и исполнения заказов</li>
                <li>Доставки приобретённых цифровых товаров</li>
                <li>Информирования о статусе заказа</li>
                <li>Технической поддержки пользователей</li>
              </ul>
              <p>
                2.3. Предоставление персональных данных является добровольным. Однако без предоставления 
                обязательных данных (email) оформление заказа невозможно.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-[#00ff9d] mb-4">
              3. Использование данных
            </h2>
            <div className="space-y-3 text-gray-300">
              <p>
                3.1. Персональные данные используются исключительно для:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Обработки заказов и доставки товаров</li>
                <li>Отправки уведомлений о статусе заказа на указанный email</li>
                <li>Предоставления технической поддержки</li>
                <li>Улучшения качества обслуживания</li>
              </ul>
              <p>
                3.2. Оператор <strong>не использует</strong> персональные данные для:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Рассылки рекламных материалов без согласия Пользователя</li>
                <li>Передачи третьим лицам в коммерческих целях</li>
                <li>Принятия автоматизированных решений, затрагивающих права Пользователя</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-[#00ff9d] mb-4">
              4. Передача данных третьим лицам
            </h2>
            <div className="space-y-3 text-gray-300">
              <p>
                4.1. Оператор <strong>не передаёт</strong> персональные данные Пользователя третьим лицам, 
                за исключением:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Платёжных систем и банков для обработки платежей (только данные, необходимые для оплаты)</li>
                <li>Государственных органов в случаях, предусмотренных законодательством РФ</li>
                <li>Сервисов доставки цифровых товаров (в минимально необходимом объёме)</li>
              </ul>
              <p>
                4.2. Оператор требует от всех третьих лиц обеспечения конфиденциальности переданных 
                персональных данных в соответствии с законодательством РФ.
              </p>
              <p>
                4.3. <strong>Персональные данные не продаются и не передаются в маркетинговые или иные 
                коммерческие цели третьих лиц.</strong>
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-[#00ff9d] mb-4">
              5. Хранение и удаление данных
            </h2>
            <div className="space-y-3 text-gray-300">
              <p>
                5.1. Персональные данные хранятся на защищённых серверах в течение срока, необходимого 
                для исполнения обязательств перед Пользователем.
              </p>
              <p>
                5.2. <strong>Удаление данных происходит:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>По завершении транзакции и истечении гарантийного периода (14 дней)</li>
                <li>По письменному запросу Пользователя (в течение 30 дней)</li>
                <li>При отзыве согласия на обработку персональных данных</li>
              </ul>
              <p>
                5.3. После удаления данные не подлежат восстановлению, за исключением случаев, когда 
                хранение требуется по законодательству РФ (например, для налогового учёта).
              </p>
              <p>
                5.4. Оператор принимает необходимые технические и организационные меры для защиты 
                персональных данных от неправомерного доступа, уничтожения или изменения.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-[#00ff9d] mb-4">
              6. Cookies и технические данные
            </h2>
            <div className="space-y-3 text-gray-300">
              <p>
                6.1. Сайт использует файлы cookies для:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Аутентификации пользователей</li>
                <li>Сохранения настроек и предпочтений</li>
                <li>Анализа посещаемости (в обезличенном виде)</li>
                <li>Корректного отображения контента</li>
              </ul>
              <p>
                6.2. Пользователь может отключить cookies в настройках браузера, однако это может 
                ограничить функциональность Сайта.
              </p>
              <p>
                6.3. Технические данные (IP-адрес, User-Agent) собираются автоматически и используются 
                исключительно в агрегированном виде для анализа трафика.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-[#00ff9d] mb-4">
              7. Права пользователя
            </h2>
            <div className="space-y-3 text-gray-300">
              <p>
                7.1. Пользователь вправе:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Получить информацию об обработке своих персональных данных</li>
                <li>Требовать уточнения, блокирования или уничтожения данных</li>
                <li>Отозвать согласие на обработку персональных данных</li>
                <li>Требовать прекращения рассылки уведомлений</li>
              </ul>
              <p>
                7.2. Для реализации прав Пользователь может обратиться в службу поддержки:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Telegram: <a href="https://t.me/neymaryshop_support" target="_blank" rel="noopener noreferrer" className="text-[#00ff9d] hover:underline">https://t.me/neymaryshop_support</a></li>
                <li>Email: support@neymaryshop.com</li>
              </ul>
              <p>
                7.3. Запрос рассматривается в течение 30 дней с момента получения.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-[#00ff9d] mb-4">
              8. Изменения в Политике
            </h2>
            <div className="space-y-3 text-gray-300">
              <p>
                8.1. Оператор оставляет за собой право вносить изменения в настоящую Политику в 
                одностороннем порядке.
              </p>
              <p>
                8.2. Новая редакция Политики вступает в силу с момента её размещения на Сайте.
              </p>
              <p>
                8.3. О существенных изменениях Пользователи уведомляются через Сайт не менее чем за 
                7 дней до вступления изменений в силу.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-[#00ff9d] mb-4">
              9. Согласие на обработку данных
            </h2>
            <div className="space-y-3 text-gray-300">
              <p>
                9.1. Оформляя заказ на Сайте, Пользователь подтверждает, что:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ознакомлен с настоящей Политикой конфиденциальности</li>
                <li>Даёт согласие на обработку персональных данных в указанных целях</li>
                <li>Понимает, что может отозвать согласие в любой момент</li>
                <li>Предоставил достоверные и полные данные</li>
              </ul>
              <p>
                9.2. Данное согласие действует до момента его отзыва Пользователем.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-[#00ff9d] mb-4">
              10. Контакты
            </h2>
            <div className="bg-[#111] border border-gray-800 rounded-lg p-6 space-y-2 text-gray-300">
              <p><strong>Владелец:</strong> Индивидуальный предприниматель Ионцев Константин Константинович</p>
              <p><strong>Поддержка:</strong> <a href="https://t.me/neymaryshop_support" target="_blank" rel="noopener noreferrer" className="text-[#00ff9d] hover:underline">https://t.me/neymaryshop_support</a></p>
              <p><strong>Telegram канал:</strong> <a href="https://t.me/neymaryshop" target="_blank" rel="noopener noreferrer" className="text-[#00ff9d] hover:underline">https://t.me/neymaryshop</a></p>
              <p><strong>Email:</strong> support@neymaryshop.com</p>
            </div>
          </section>

          {/* Footer info */}
          <div className="border-t border-gray-800 pt-8 mt-12">
            <p className="text-gray-500 text-sm">
              Последнее обновление: 21 февраля 2026 г.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              © 2021-2026 NeymaryShop. Все права защищены.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
