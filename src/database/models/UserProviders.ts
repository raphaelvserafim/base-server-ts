import { DataTypes, Model, Sequelize } from 'sequelize';
import { PROVIDERS, UserProvidersAttributes } from '@app/types/index.js';
import { UsersEntity } from '@app/database/index.js';

class UserProvidersEntity extends Model<UserProvidersAttributes> {

  public static initialize(sequelize: Sequelize) {

    this.init(
      {
        id: {
          type: DataTypes.BIGINT,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true
        },
        userId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: UsersEntity,
            key: 'id',
          },
        },
        clientId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        provider: {
          type: DataTypes.ENUM,
          values: Object.values(PROVIDERS),
          allowNull: false,
          defaultValue: PROVIDERS.GOOGLE,
        },
        locale: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        picture: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'user_providers',
        timestamps: true,
        underscored: true,
      }
    );
  }
}

export { UserProvidersEntity };
