import { ChatConfigurator, DataSource, ExtensionsDataSource } from "../../shared/framework";
import { ExtensionConstants } from "../ExtensionConstants";
import { LinkPreviewConfigurationInterface } from "./LinkPreviewConfiguration";
import { LinkPreviewExtentionDecorator } from "./LinkPreviewExtentionDecorator";

export class LinkPreviewExtention extends ExtensionsDataSource {
    linkPreviewConfiguration: LinkPreviewConfigurationInterface

    constructor(linkPreviewConfiguration?: LinkPreviewConfigurationInterface) {
        super();
        this.linkPreviewConfiguration = linkPreviewConfiguration ? linkPreviewConfiguration : undefined
    }

    //override addExtension method from ExtensionsDataSource interface
    override addExtension(): void {
        ChatConfigurator.enable(( dataSource : DataSource )=>{
            return new LinkPreviewExtentionDecorator(dataSource, this.linkPreviewConfiguration)
        }  )
    }
  
    //override getExtensionId method from ExtensionsDataSource interface
    override getExtensionId(): string {
      return ExtensionConstants.linkPreview;
    }
}