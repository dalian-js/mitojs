import { EventTypes, SDK_VERSION } from '@mitojs/shared'
import { BaseClientType, BaseOptionsFieldsIntegrationType, BasePluginType, LogTypes } from '@mitojs/types'
import { logger } from '@mitojs/utils'
import { BaseTransport, Breadcrumb } from '.'
import { Subscrib } from './subscribe'

/**
 * 抽象客户端，已实现插件和钩子函数的定义
 * 如果目前的钩子函数满足不了业务，需要在use中额外添加钩子，并在各个端实现
 *
 * @export
 * @abstract
 * @class BaseClient
 * @implements {BaseClientType}
 * @template O
 * @template E
 */
export abstract class BaseClient<
  O extends BaseOptionsFieldsIntegrationType = BaseOptionsFieldsIntegrationType,
  E extends EventTypes = EventTypes
> implements BaseClientType
{
  SDK_NAME: string
  SDK_VERSION = SDK_VERSION
  options: BaseOptionsFieldsIntegrationType
  abstract breadcrumb: Breadcrumb
  abstract transport: BaseTransport
  constructor(options: O) {
    this.options = options
    logger.bindOptions(options.debug)
  }

  /**
   * 引用插件
   *
   * @param {BasePluginType<E>[]} plugins
   * @memberof BaseClient
   */
  use(plugins: BasePluginType<E>[]) {
    const subscrib = new Subscrib<E>()
    plugins.forEach((item) => {
      if (!this.isPluginEnable(item.name)) return
      item.monitor.call(this, subscrib.notify.bind(subscrib))
      const wrapperTranform = (...args: any[]) => {
        const res = item.transform?.apply(this, args)
        item.consumer?.call(this, res)
      }
      subscrib.watch(item.name, wrapperTranform)
    })
  }
  getOptions() {
    return this.options
  }

  /**
   * 判断当前插件是否启用，每个端的可选字段不同，需要子类实现
   *
   * @abstract
   * @param {EventTypes} name
   * @return {*}  {boolean}
   * @memberof BaseClient
   */
  abstract isPluginEnable(name: EventTypes): boolean

  /**
   * 手动上报方法，每个端需要自己实现
   *
   * @abstract
   * @param {LogTypes} data
   * @memberof BaseClient
   */
  abstract log(data: LogTypes): void
}
