import { DataSource } from "./DataSource";
import { MessageDataSource } from "./MessageDataSource";

export class ChatConfigurator {
  static dataSource: DataSource = new MessageDataSource();

  static names: string[] = ["message_utils"];

  static init(initialSource?: DataSource) {
    this.dataSource = initialSource ?? new MessageDataSource();
    this.names = ["message_utils"]
    this.names.push(this.dataSource.getId());
  }

  static enable(fun: (source: DataSource) => DataSource) {
    let oldSource: DataSource = this.dataSource;
    let newSource: DataSource = fun(oldSource);
    if (!this.names.find(nm => nm == newSource.getId())) {
      console.log("added", newSource.getId() );
      this.dataSource = newSource;
      this.names.push(this.dataSource.getId());
    }
  }

  static getDataSource() {
    return ChatConfigurator.dataSource;
  }
}